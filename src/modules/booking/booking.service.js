"use strict";

const prisma = require("../../config/prisma");
const crypto = require("crypto");
const razorpay = require("../payment/razorpay");

const LOCK_TIME_MINUTES = 5;

const cleanPrice = (price) =>
  parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0;

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const generatePNR = () =>
  "PNR" + crypto.randomBytes(5).toString("hex").toUpperCase();


// ================= CREATE BOOKING =================

const createBookingService = async (data, userId) => {

  const type = data.bookingType?.toUpperCase();
  const { entityId, offer } = data;

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

      const bus = await tx.bus.findUnique({ where: { id: entityId } });

      if (!bus) throw new Error("Bus not found");
      if (bus.seats <= 0) throw new Error("No seats available");

      price = Number(bus.price);
      if (!price || price <= 0) throw new Error("Invalid price");

      await tx.bus.update({
        where: { id: entityId },
        data: { seats: { decrement: 1 } }
      });

      bookingData.busId = entityId;
    }

    // ================= TRAIN =================
    if (type === "TRAIN") {
      if (!entityId) throw new Error("Train ID required");

      const train = await tx.train.findUnique({ where: { id: entityId } });

      if (!train) throw new Error("Train not found");
      if (train.seats <= 0) throw new Error("No seats available");

      price = Number(train.price);
      if (!price || price <= 0) throw new Error("Invalid price");

      await tx.train.update({
        where: { id: entityId },
        data: { seats: { decrement: 1 } }
      });

      bookingData.trainId = entityId;
    }

    // ================= FLIGHT =================
    if (type === "FLIGHT") {

      if (entityId) {
        const flight = await tx.flight.findUnique({
          where: { id: entityId }
        });

        if (!flight) throw new Error("Flight not found");
        if (flight.seats !== null && flight.seats <= 0)
          throw new Error("No seats available");

        price = Number(flight.price);
        if (!price || price <= 0) throw new Error("Invalid price");

        if (flight.seats !== null) {
          await tx.flight.update({
            where: { id: entityId },
            data: { seats: { decrement: 1 } }
          });
        }

        bookingData.flightId = entityId;
      }

      else if (offer) {
        price = cleanPrice(offer.price);
        if (!price) throw new Error("Invalid offer price");

        bookingData.flightData = offer;
      }

      else {
        throw new Error("Flight data required");
      }
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


// ================= CANCEL + REFUND =================

const cancelBookingService = async (bookingId) => {

  return await prisma.$transaction(async (tx) => {

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { bus: true, train: true, flight: true }
    });

    if (!booking) throw new Error("Booking not found");

    if (booking.status === "CANCELLED") {
      throw new Error("Already cancelled");
    }

    if (booking.status !== "CONFIRMED") {
      throw new Error("Only confirmed bookings can be cancelled");
    }

    // ================= GET PAYMENT =================
    const payment = await tx.payment.findUnique({
      where: { bookingId },
    });

    if (!payment || payment.status !== "SUCCESS") {
      throw new Error("Valid payment not found");
    }

    const paymentId = payment.transactionId;

    // ================= GET JOURNEY TIME =================
    let departure;

    if (booking.bus) departure = booking.bus.departure;
    if (booking.train) departure = booking.train.departure;
    if (booking.flight) departure = booking.flight.departure;
    if (booking.flightData) departure = booking.flightData.departure;

    const diffHours =
      departure
        ? (new Date(departure) - new Date()) / 36e5
        : 0;

    let refundAmount = 0;

    if (diffHours > 24) refundAmount = booking.totalPrice;
    else if (diffHours > 12) refundAmount = booking.totalPrice * 0.5;

    // ================= RAZORPAY REFUND =================
    let refundResponse = null;

    if (refundAmount > 0) {
      try {
        refundResponse = await razorpay.payments.refund(paymentId, {
          amount: Math.round(refundAmount * 100),
        });
      } catch (err) {
        console.error("REFUND ERROR:", err);
        throw new Error("Refund failed");
      }
    }

    // ================= RESTORE SEATS =================
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

    // ================= UPDATE BOOKING =================
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    await tx.payment.update({
      where: { bookingId },
      data: {
        status: refundAmount > 0 ? "REFUNDED" : "SUCCESS",
      },
    });

    await tx.refund.create({
      data: {
        bookingId,
        amount: refundAmount,
        status: refundAmount > 0 ? "SUCCESS" : "NO_REFUND",
      },
    });

    return {
      message: "Booking cancelled successfully",
      refundAmount,
      razorpayRefundId: refundResponse?.id || null,
    };
  });
};

function computeRefund(totalPrice, departureTime) {
  const hours = (new Date(departureTime) - new Date()) / 36e5;

  if (hours > 24) return totalPrice;
  if (hours > 2) return totalPrice * 0.5;

  return 0;
}

// ================= EXPORT =================

module.exports = {
  createBookingService,
  getBookingHistoryService,
  cancelBookingService,
};

console.log("✅ FINAL PRODUCTION SERVICE RUNNING");