"use strict";

const prisma = require("../../config/prisma");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { sendCancellationEmail } = require("../../utils/email");
const razorpay = require("../payment/razorpay");


const LOCK_TIME_MINUTES = 5;

const CANCELLABLE_STATUSES = ["PENDING_PAYMENT", "CONFIRMED"];

const cleanPrice = (price) =>
  parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0;

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const generatePNR = () =>
  "PNR" + crypto.randomBytes(5).toString("hex").toUpperCase();


// ================= CREATE BOOKING =================

const createBookingService = async (data, userId) => {

  const type = data.bookingType?.toUpperCase(); // ✅ IMPORTANT FIX
  const { entityId, offer } = data;

  console.log("BOOKING DATA:", data); // 🔍 DEBUG

  if (!type) throw new Error("Booking type required");

  if (!["FLIGHT", "TRAIN", "BUS"].includes(type)) {
    throw new Error("Invalid booking type");
  }

  if (!isValidEmail(data.passengerEmail)) {
    throw new Error("Invalid email");
  }

  let price = 0;

  let bookingData = {
    userId,
    bookingType: type,
    pnr: generatePNR(),
    passengerName: data.passengerName || "Guest",
    passengerAge: data.passengerAge || 21,
    passengerPhone: data.passengerPhone,
    passengerEmail: data.passengerEmail,
    status: "PENDING_PAYMENT",
    lockExpiry: new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000),
  };

  return await prisma.$transaction(async (tx) => {

    // ================= BUS =================
    if (type === "BUS") {

  if (!entityId) throw new Error("Bus ID required");

  const bus = await tx.bus.findUnique({
    where: { id: entityId }
  });

  if (!bus) throw new Error("Bus not found");

  if (bus.seats <= 0) {
    throw new Error("No seats available");
  }

  // ✅ FIRST assign price
  price = Number(bus.price);

  // ✅ THEN validate
  if (!price || isNaN(price) || price <= 0) {
    throw new Error("Invalid price");
  }

  await tx.bus.update({
    where: { id: entityId },
    data: { seats: { decrement: 1 } }
  });

  bookingData.busId = entityId;
}
    // ================= TRAIN =================
    if (type === "TRAIN") {

      if (!entityId) throw new Error("Train ID required");

      const train = await tx.train.findUnique({
        where: { id: entityId }
      });

      if (!train) throw new Error("Train not found");

      if (train.seats <= 0) {
        throw new Error("No seats available");
      }

      price = train.price;

      await tx.train.update({
        where: { id: entityId },
        data: { seats: { decrement: 1 } }
      });

      bookingData.trainId = entityId;
    }

    // ================= FLIGHT =================
    if (type === "FLIGHT") {

      // DB MODE
      if (entityId) {
        const flight = await tx.flight.findUnique({
          where: { id: entityId }
        });

        if (!flight) throw new Error("Flight not found");

        if (flight.seats !== null && flight.seats <= 0) {
          throw new Error("No seats available");
        }

        price = flight.price;

        if (flight.seats !== null) {
          await tx.flight.update({
            where: { id: entityId },
            data: { seats: { decrement: 1 } }
          });
        }

        bookingData.flightId = entityId;
      }

      // API MODE
      else if (offer) {
        price = cleanPrice(offer.price);

        if (!price) throw new Error("Invalid offer price");

        bookingData.flightData = offer;
      }

      else {
        throw new Error("Flight data required");
      }
    }

    // FINAL PRICE CHECK (🔥 FIX)
    if (!price || price <= 0) {
      throw new Error("Invalid price");
    }

    bookingData.totalPrice = price;
    bookingData.priceAtBooking = price;

    const booking = await tx.booking.create({
      data: bookingData
    });

    return booking;
  });
};


// ================= HISTORY =================

const getBookingHistoryService = async (userId) => {

  if (!userId) throw new Error("User ID required");

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


// ================= CANCEL =================



/* =========================
   CANCEL + REFUND SERVICE
========================= */

const cancelBookingService = async (bookingId) => {
  return await prisma.$transaction(async (tx) => {

    /* =========================
       GET BOOKING
    ========================= */

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new Error("Booking not found");

    if (booking.status === "CANCELLED") {
      throw new Error("Booking already cancelled");
    }

    if (booking.status !== "CONFIRMED") {
      throw new Error("Only confirmed bookings can be cancelled");
    }

    /* =========================
       GET PAYMENT
    ========================= */

    const payment = await tx.payment.findUnique({
      where: { bookingId },
    });

    if (!payment || payment.status !== "SUCCESS") {
      throw new Error("Valid payment not found");
    }

    const paymentId = payment.transactionId;

    if (!paymentId) {
      throw new Error("Missing Razorpay payment ID");
    }

    /* =========================
       REFUND CALCULATION
    ========================= */

    const journeyTime =
      booking.createdAt || new Date(Date.now() + 48 * 60 * 60 * 1000);

    const hoursLeft =
      (new Date(journeyTime) - new Date()) / (1000 * 60 * 60);

    let refundAmount = 0;

    if (hoursLeft > 24) {
      refundAmount = booking.totalPrice; // full
    } else if (hoursLeft > 12) {
      refundAmount = booking.totalPrice * 0.5; // half
    } else {
      refundAmount = 0; // no refund
    }

    /* =========================
       RAZORPAY REFUND
    ========================= */

    let refundResponse = null;

    if (refundAmount > 0) {
      try {
        refundResponse = await razorpay.payments.refund(paymentId, {
          amount: Math.round(refundAmount * 100), // paise
        });
      } catch (err) {
        console.error("RAZORPAY REFUND ERROR:", err);
        throw new Error("Refund failed from Razorpay");
      }
    }

    /* =========================
       RESTORE SEATS
    ========================= */

    if (booking.flightId) {
      await tx.flight.update({
        where: { id: booking.flightId },
        data: { seats: { increment: 1 } },
      });
    }

    if (booking.trainId) {
      await tx.train.update({
        where: { id: booking.trainId },
        data: { seats: { increment: 1 } },
      });
    }

    if (booking.busId) {
      await tx.bus.update({
        where: { id: booking.busId },
        data: { seats: { increment: 1 } },
      });
    }

    /* =========================
       UPDATE BOOKING
    ========================= */

    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    /* =========================
       UPDATE PAYMENT STATUS
    ========================= */

    await tx.payment.update({
      where: { bookingId },
      data: {
        status: refundAmount > 0 ? "REFUNDED" : "SUCCESS",
      },
    });

    /* =========================
       STORE REFUND RECORD
    ========================= */

    await tx.refund.create({
      data: {
        bookingId,
        amount: refundAmount,
        status: refundAmount > 0 ? "SUCCESS" : "NO_REFUND",
      },
    });

    /* =========================
       RETURN RESPONSE
    ========================= */

    return {
      message: "Booking cancelled successfully",
      refundAmount,
      razorpayRefundId: refundResponse?.id || null,
    };
  });
};



// ================= REFUND =================

const calculateRefund = (booking) => {

  let departure;

  if (booking.bus) departure = booking.bus.departure;
  if (booking.train) departure = booking.train.departure;
  if (booking.flight) departure = booking.flight.departure;
  if (booking.flightData) departure = booking.flightData.departure;

  if (!departure) return 0;

  const diffHours =
    (new Date(departure) - new Date()) / (1000 * 60 * 60);

  if (diffHours > 24) return booking.totalPrice;
  if (diffHours > 2) return booking.totalPrice * 0.5;

  return 0;
};




console.log("✅ FINAL PRODUCTION SERVICE RUNNING");

// ================= HISTORY =================



module.exports = {
  createBookingService,
  getBookingHistoryService,
  cancelBookingService,
};

console.log("✅ FINAL PRODUCTION SERVICE RUNNING");