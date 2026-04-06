"use strict";

const prisma = require("../../config/prisma");
const crypto = require("crypto");
const { sendCancellationEmail } = require("../../utils/email");


const LOCK_TIME_MINUTES = 5;


const CANCELLABLE_STATUSES = ["PENDING_PAYMENT", "CONFIRMED"];

const cleanPrice = (price) =>
  parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0;

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const generatePNR = () =>
  "PNR" + crypto.randomBytes(5).toString("hex").toUpperCase();

const resolveTransport = (type, data) => {
  const map = {
    BUS: { field: "busId", rawId: data.busId },
    TRAIN: { field: "trainId", rawId: data.trainId },
    
  };

  const entry = map[type];
  if (!entry) throw new Error(`Invalid booking type: ${type}`);

  const id = Number(entry.rawId);
  if (!id || isNaN(id)) {
    throw new Error(`${type} ID is missing or invalid`);
  }

  return { field: entry.field, id };
};


const createBookingService = async (data) => {
  const {
    bookingType,
    passengerName,
    passengerAge,
    passengerPhone,
    passengerEmail,
    totalPrice,
    userId,
    flight
  } = data;

  const type = bookingType?.toUpperCase();

  if (!type) throw new Error("Booking type required");

  if (!["BUS", "TRAIN", "FLIGHT"].includes(type)) {
    throw new Error("Invalid booking type");
  }

  if (!passengerPhone || !passengerEmail) {
    throw new Error("Passenger details required");
  }

  const price = parseFloat(totalPrice);
  if (!price || price <= 0) throw new Error("Invalid price");

  const lockExpiry = new Date(Date.now() + 5 * 60 * 1000);

  return await prisma.$transaction(async (tx) => {

    let transportField = null;
    let transportId = null;

    
    if (type !== "FLIGHT") {
      const result = resolveTransport(type, data);
      transportField = result.field;
      transportId = result.id;

      const modelMap = {
        BUS: tx.bus,
        TRAIN: tx.train,
      };

      const model = modelMap[type];

      const transport = await model.findUnique({
        where: { id: transportId },
      });

      if (!transport) throw new Error(`${type} not found`);

      if (transport.seats <= 0) {
        throw new Error("No seats available");
      }

      await model.update({
        where: { id: transportId },
        data: { seats: { decrement: 1 } },
      });
    }

    
    const bookingData = {
      pnr: generatePNR(),
      bookingType: type,
      passengerName: passengerName || "Guest",
      passengerAge: Number(passengerAge) || 21,
      passengerPhone,
      passengerEmail,
      totalPrice: price,
      priceAtBooking: price,
      status: "PENDING_PAYMENT",
      lockExpiry,
      userId,
    };


    if (type === "FLIGHT") {
      if (!flight) {
        throw new Error("Flight data required");
      }

      bookingData.flightData = flight; 
    } else {
      bookingData[transportField] = transportId;
    }

    const booking = await tx.booking.create({
      data: bookingData,
    });

    return booking;
  });
};




const getBookingHistoryService = async (userId) => {

  console.log("USER ID:", userId); 

  if (!userId) {
    throw new Error("User ID required");
  }

  return prisma.booking.findMany({
    where: { userId },
    include: {
      bus: true,
      train: true,
      flight: true,
    },
    orderBy: { createdAt: "desc" },
  });
};



const cancelBookingService = async (bookingId) => {
  if (!bookingId) throw new Error("Booking ID required");

  let email;
  let cancelled;
  let refundAmount = 0;

  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        bus: true,
        train: true,
        flight: true,
        payment: true,
      },
    });

    if (!booking) throw new Error("Booking not found");

    if (booking.status === "CANCELLED") {
      throw new Error("Already cancelled");
    }

    
    const transport =
      booking.bus || booking.train || booking.flight;

   
    if (booking.status === "CONFIRMED") {
      refundAmount = calculateRefund(booking, transport);

      await tx.payment.update({
        where: { bookingId: booking.id },
        data: {
          status: "SUCCESS",
          transactionId: `REFUND_${Date.now()}`,
        },
      });
    }

 
    const seatRestoreMap = [
      { id: booking.busId, model: tx.bus },
      { id: booking.trainId, model: tx.train },
      
    ];

    for (const { id, model } of seatRestoreMap) {
      if (id) {
        await model.update({
          where: { id },
          data: { seats: { increment: 1 } },
        });
      }
    }

    cancelled = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    email = booking.passengerEmail;
  });

 
  if (email) {
    try {
      await sendCancellationEmail(email, {
        ...cancelled,
        refundAmount,
      });
    } catch (err) {
      console.error("EMAIL ERROR:", err.message);
    }
  }

  return {
    ...cancelled,
    refundAmount,
  };
};


const calculateRefund = (booking) => {
  let departure;

  if (booking.bus) departure = booking.bus.departure;
  if (booking.train) departure = booking.train.departure;
  if (booking.flightData) {
  departure = booking.flightData.departure;
}

  if (!departure) return 0;

  const diffHours =
    (new Date(departure) - new Date()) / (1000 * 60 * 60);

  if (diffHours > 24) return booking.totalPrice;
  if (diffHours > 2) return booking.totalPrice * 0.5;

  return 0;
};


module.exports = {
  createBookingService,
  getBookingHistoryService,
  cancelBookingService,
};

console.log("✅ NEW SERVICE FILE RUNNING");