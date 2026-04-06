"use strict";

const prisma = require("../lib/prisma");

// ─────────────────────────────────────────
// RESULT CODES
// ─────────────────────────────────────────

const CODE = {
  SUCCESS: "SUCCESS",
  ALREADY_CHECKED_IN: "ALREADY_CHECKED_IN",
  BOOKING_NOT_FOUND: "BOOKING_NOT_FOUND",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  BOOKING_EXPIRED: "BOOKING_EXPIRED",
  PAYMENT_NOT_DONE: "PAYMENT_NOT_DONE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

const MESSAGES = {
  SUCCESS: "Check-in successful. Welcome aboard!",
  ALREADY_CHECKED_IN: "This ticket has already been used.",
  BOOKING_NOT_FOUND: "Invalid QR. No booking found.",
  BOOKING_CANCELLED: "This booking has been cancelled.",
  BOOKING_EXPIRED: "This ticket has expired.",
  PAYMENT_NOT_DONE: "Payment incomplete.",
  INTERNAL_ERROR: "Validation error. Please retry.",
};

// ─────────────────────────────────────────
// SELECT (MATCHES YOUR SCHEMA)
// ─────────────────────────────────────────

const BOOKING_SELECT = {
  id: true,
  pnr: true,
  status: true,
  checkedIn: true,
  checkedInAt: true,
  bookingType: true,

  passengerName: true,
  passengerEmail: true,
  totalPrice: true,

  bus: { select: { fromCity: true, toCity: true, departure: true } },
  train: { select: { fromCity: true, toCity: true, departure: true } },
  flight: { select: { fromCity: true, toCity: true, departure: true } },

  payment: { select: { status: true } },
};

// ─────────────────────────────────────────
// HELPER: GET TRAVEL DATA
// ─────────────────────────────────────────

const getTravelData = (booking) => {
  if (!booking) return {};
  if (booking.bus) return booking.bus;
  if (booking.train) return booking.train;
  if (booking.flight) return booking.flight;
  return {};
};

// ─────────────────────────────────────────
// BUILD RESPONSE
// ─────────────────────────────────────────

const buildResult = (code, booking = null, extra = {}) => {
  const travel = getTravelData(booking);

  return {
    valid: code === CODE.SUCCESS,
    code,
    message: MESSAGES[code],

    passenger: booking
      ? {
          name: booking.passengerName,
          email: booking.passengerEmail,
        }
      : null,

    travel: booking
      ? {
          pnr: booking.pnr,
          bookingType: booking.bookingType,
          from: travel.fromCity || null,
          to: travel.toCity || null,
          departure: travel.departure || null,
          totalPrice: booking.totalPrice,
        }
      : null,

    ...extra,
  };
};

// ─────────────────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────────────────

const validateAndCheckIn = async (pnr) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { pnr },
      select: BOOKING_SELECT,
    });

    // ❌ Not found
    if (!booking) {
      return buildResult(CODE.BOOKING_NOT_FOUND);
    }

    // ❌ Already checked in
    if (booking.checkedIn) {
      return buildResult(CODE.ALREADY_CHECKED_IN, booking, {
        checkedInAt: booking.checkedInAt,
      });
    }

    // ❌ Cancelled
    if (booking.status === "CANCELLED") {
      return buildResult(CODE.BOOKING_CANCELLED, booking);
    }

    // ❌ Expired
    if (booking.status === "EXPIRED") {
      return buildResult(CODE.BOOKING_EXPIRED, booking);
    }

    // ❌ Payment not done
    if (!booking.payment || booking.payment.status !== "SUCCESS") {
      return buildResult(CODE.PAYMENT_NOT_DONE, booking);
    }

    // ✅ CHECK-IN UPDATE
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
      },
    });

    return buildResult(CODE.SUCCESS, booking, {
      checkedInAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("❌ VALIDATION ERROR:", err);

    return {
      valid: false,
      code: CODE.INTERNAL_ERROR,
      message: err.message,
      passenger: null,
      travel: null,
    };
  }
};

module.exports = { validateAndCheckIn, CODE };