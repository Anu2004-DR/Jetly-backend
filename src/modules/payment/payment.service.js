const prisma = require("../../config/prisma");
const { sendTicketEmail } = require("../../utils/email");
const generateTicketPDF = require("../../utils/pdf");

const normalizeTicketData = (booking) => {
  const route =
    booking.flight
      ? {
          fromCity: booking.flight.fromCity,
          toCity: booking.flight.toCity,
          date: booking.flight.departure,
          time: booking.flight.departure,
        }
      : booking.train
      ? {
          fromCity: booking.train.fromCity,
          toCity: booking.train.toCity,
          date: booking.createdAt,
          time: booking.train.departure,
        }
      : booking.bus
      ? {
          fromCity: booking.bus.fromCity,
          toCity: booking.bus.toCity,
          date: booking.createdAt,
          time: booking.bus.departure,
        }
      : {
          fromCity: "N/A",
          toCity: "N/A",
          date: booking.createdAt,
          time: "",
        };

  return {
    id: booking.id,
    pnr: booking.pnr,
    passengerName: booking.passengerName,
    passengerEmail: booking.passengerEmail,
    bookingType: booking.bookingType,
    totalPrice: booking.totalPrice,
    ...route,
  };
};

const releaseSeats = async (tx, booking) => {
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
};

const verifyPaymentService = async ({
  bookingId,
  paymentStatus,
  transactionId,
}) => {
  if (!bookingId) throw new Error("Booking ID required");

  let result;

  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { bus: true, train: true, flight: true },
    });

    if (!booking) throw new Error("Booking not found");

    if (paymentStatus === "FAILED") {
      await releaseSeats(tx, booking);

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "FAILED" },
      });

      result = { message: "Payment failed" };
      return;
    }

    const confirmedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
      include: { bus: true, train: true, flight: true },
    });

    await tx.payment.upsert({
      where: { bookingId },
      update: {
        amount: confirmedBooking.totalPrice,
        status: "SUCCESS",
        transactionId,
      },
      create: {
        bookingId,
        amount: confirmedBooking.totalPrice,
        status: "SUCCESS",
        transactionId,
      },
    });

    result = normalizeTicketData(confirmedBooking);
  });

  if (paymentStatus === "SUCCESS" && result?.passengerEmail) {
    try {
      const filePath = await generateTicketPDF(result);
      await sendTicketEmail(
        result.passengerEmail,
        result,
        filePath
      );
    } catch (err) {
      console.error("PDF/Email Error:", err.message);
    }
  }

  return result;
};

module.exports = {
  verifyPaymentService,
};