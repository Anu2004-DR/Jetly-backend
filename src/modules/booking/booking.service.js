"use strict";

const prisma = require("../../config/prisma");
const crypto = require("crypto");
const razorpay = require("../payment/razorpay");

const LOCK_TIME_MINUTES = 5;

/* =========================
   HELPERS
========================= */

const cleanPrice = (price) =>
  parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0;

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPhone = (phone) =>
  /^[6-9]\d{9}$/.test(String(phone));

const generatePNR = () =>
  "PNR" + crypto.randomBytes(5).toString("hex").toUpperCase();

const computeRefund = (totalPrice, departureTime) => {
  const hours =
    (new Date(departureTime) - new Date()) / 36e5;

  if (hours > 24) return totalPrice;

  if (hours > 12) return totalPrice * 0.5;

  return 0;
};

/* =========================
   RELEASE EXPIRED BOOKINGS
========================= */

const releaseExpiredBookings = async (tx) => {
  const expiredBookings = await tx.booking.findMany({
    where: {
      status: "PENDING_PAYMENT",
      lockExpiry: {
        lt: new Date(),
      },
    },
  });

  for (const booking of expiredBookings) {

    if (booking.flightId) {
      await tx.flight.update({
        where: { id: booking.flightId },
        data: {
          seats: {
            increment: 1,
          },
        },
      });
    }

    if (booking.trainId) {
      await tx.train.update({
        where: { id: booking.trainId },
        data: {
          seats: {
            increment: 1,
          },
        },
      });
    }

    if (booking.busId) {
      await tx.bus.update({
        where: { id: booking.busId },
        data: {
          seats: {
            increment: 1,
          },
        },
      });
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "EXPIRED",
      },
    });
  }
};

/* =========================
   GENERATE UNIQUE PNR
========================= */

const generateUniquePNR = async (tx) => {
  let pnr;
  let exists = true;

  while (exists) {

    pnr = generatePNR();

    const existing = await tx.booking.findUnique({
      where: { pnr },
    });

    exists = !!existing;
  }

  return pnr;
};

/* =========================
   CREATE BOOKING
========================= */

const createBookingService = async (
  data,
  userId
) => {

  const type =
    data.bookingType?.toUpperCase();

  const { entityId, offer } = data;

  if (!type) {
    throw new Error("Booking type required");
  }

  if (
    !["FLIGHT", "TRAIN", "BUS"].includes(type)
  ) {
    throw new Error("Invalid booking type");
  }

  if (!isValidEmail(data.passengerEmail)) {
    throw new Error("Invalid email");
  }

  if (!isValidPhone(data.passengerPhone)) {
    throw new Error("Invalid phone number");
  }

  return await prisma.$transaction(async (tx) => {

    // release stale holds first
    await releaseExpiredBookings(tx);

    let price = 0;

    const bookingData = {
      pnr: await generateUniquePNR(tx),

      userId,

      bookingType: type,

      passengerName:
        data.passengerName || "Guest",

      passengerAge:
        Number(data.passengerAge) || 21,

      passengerPhone: data.passengerPhone,

      passengerEmail: data.passengerEmail,

      status: "PENDING_PAYMENT",

      lockExpiry: new Date(
        Date.now() +
        LOCK_TIME_MINUTES * 60 * 1000
      ),
    };

    /* =========================
       BUS
    ========================= */

    if (type === "BUS") {

      if (!entityId) {
        throw new Error("Bus ID required");
      }

      const bus = await tx.bus.findUnique({
        where: { id: Number(entityId) },
      });

      if (!bus) {
        throw new Error("Bus not found");
      }

      price = Number(bus.price);

      if (!price || price <= 0) {
        throw new Error("Invalid bus price");
      }

      const updatedBus =
        await tx.bus.updateMany({
          where: {
            id: Number(entityId),
            seats: {
              gt: 0,
            },
          },

          data: {
            seats: {
              decrement: 1,
            },
          },
        });

      if (updatedBus.count === 0) {
        throw new Error("No seats available");
      }

      bookingData.busId = Number(entityId);
    }

    /* =========================
       TRAIN
    ========================= */

    if (type === "TRAIN") {

      if (!entityId) {
        throw new Error("Train ID required");
      }

      const train =
        await tx.train.findUnique({
          where: { id: Number(entityId) },
        });

      if (!train) {
        throw new Error("Train not found");
      }

      price = Number(train.price);

      if (!price || price <= 0) {
        throw new Error("Invalid train price");
      }

      const updatedTrain =
        await tx.train.updateMany({
          where: {
            id: Number(entityId),
            seats: {
              gt: 0,
            },
          },

          data: {
            seats: {
              decrement: 1,
            },
          },
        });

      if (updatedTrain.count === 0) {
        throw new Error("No seats available");
      }

      bookingData.trainId = Number(entityId);
    }

    /* =========================
       FLIGHT
    ========================= */

    if (type === "FLIGHT") {

      // DB flight
      if (entityId) {

        const flight =
          await tx.flight.findUnique({
            where: {
              id: Number(entityId),
            },
          });

        if (!flight) {
          throw new Error("Flight not found");
        }

        price = Number(flight.price);

        if (!price || price <= 0) {
          throw new Error("Invalid flight price");
        }

        if (flight.seats !== null) {

          const updatedFlight =
            await tx.flight.updateMany({
              where: {
                id: Number(entityId),

                seats: {
                  gt: 0,
                },
              },

              data: {
                seats: {
                  decrement: 1,
                },
              },
            });

          if (
            updatedFlight.count === 0
          ) {
            throw new Error(
              "No seats available"
            );
          }
        }

        bookingData.flightId =
          Number(entityId);
      }

      // Live API offer
      else if (offer) {

        price = cleanPrice(offer.price);

        // NEVER trust tiny values
        if (!price || price < 100) {
          throw new Error(
            "Invalid offer price"
          );
        }

        bookingData.flightData = offer;
      }

      else {
        throw new Error(
          "Flight data required"
        );
      }
    }

    bookingData.totalPrice = price;

    bookingData.priceAtBooking = price;

    const booking =
      await tx.booking.create({
        data: bookingData,
      });

    return booking;
  });
};

/* =========================
   BOOKING HISTORY
========================= */

const getBookingHistoryService = async (
  userId
) => {

  if (!userId) {
    throw new Error("User ID required");
  }

  return await prisma.booking.findMany({
    where: {
      userId,
      isDeleted: false,
    },

    include: {
      bus: true,
      train: true,
      flight: true,
      payment: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

/* =========================
   CANCEL BOOKING
========================= */

const cancelBookingService = async (
  bookingId
) => {

  return await prisma.$transaction(
    async (tx) => {

      const booking =
        await tx.booking.findUnique({
          where: { id: bookingId },

          include: {
            bus: true,
            train: true,
            flight: true,
            payment: true,
          },
        });

      if (!booking) {
        throw new Error(
          "Booking not found"
        );
      }

      if (
        booking.status === "CANCELLED"
      ) {
        throw new Error(
          "Booking already cancelled"
        );
      }

      if (
        booking.status !== "CONFIRMED"
      ) {
        throw new Error(
          "Only confirmed bookings can be cancelled"
        );
      }

      const payment =
        await tx.payment.findUnique({
          where: { bookingId },
        });

      if (
        !payment ||
        payment.status !== "SUCCESS"
      ) {
        throw new Error(
          "Valid payment not found"
        );
      }

      let departure;

      if (booking.bus) {
        departure =
          booking.bus.departure;
      }

      if (booking.train) {
        departure =
          booking.train.departure;
      }

      if (booking.flight) {
        departure =
          booking.flight.departure;
      }

      if (booking.flightData) {
        departure =
          booking.flightData.departure;
      }

      const refundAmount =
        computeRefund(
          booking.totalPrice,
          departure
        );

      let refundResponse = null;

      /* =========================
         RAZORPAY REFUND
      ========================= */

      if (refundAmount > 0) {

        try {

          refundResponse =
            await razorpay.payments.refund(
              payment.transactionId,
              {
                amount: Math.round(
                  refundAmount * 100
                ),
              }
            );

        } catch (err) {

          console.error(
            "REFUND ERROR:",
            err
          );

          throw new Error(
            "Refund failed"
          );
        }
      }

      /* =========================
         RESTORE SEATS
      ========================= */

      if (booking.flightId) {
        await tx.flight.update({
          where: {
            id: booking.flightId,
          },

          data: {
            seats: {
              increment: 1,
            },
          },
        });
      }

      if (booking.trainId) {
        await tx.train.update({
          where: {
            id: booking.trainId,
          },

          data: {
            seats: {
              increment: 1,
            },
          },
        });
      }

      if (booking.busId) {
        await tx.bus.update({
          where: {
            id: booking.busId,
          },

          data: {
            seats: {
              increment: 1,
            },
          },
        });
      }

      /* =========================
         UPDATE BOOKING
      ========================= */

      await tx.booking.update({
        where: { id: bookingId },

        data: {
          status: "CANCELLED",
        },
      });

      await tx.payment.update({
        where: { bookingId },

        data: {
          status:
            refundAmount > 0
              ? "REFUNDED"
              : "SUCCESS",
        },
      });

      await tx.refund.create({
        data: {
          bookingId,

          amount: refundAmount,

          status:
            refundAmount > 0
              ? "SUCCESS"
              : "NO_REFUND",
        },
      });

      return {
        message:
          "Booking cancelled successfully",

        refundAmount,

        razorpayRefundId:
          refundResponse?.id || null,
      };
    }
  );
};

/* =========================
   EXPORTS
========================= */

module.exports = {
  createBookingService,
  getBookingHistoryService,
  cancelBookingService,
};