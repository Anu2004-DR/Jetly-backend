const prisma = require("../../config/prisma");
const { sendTicketEmail } = require("../../utils/email");
const generateTicketPDF = require("../../utils/pdf");

function generatePNR() {
  return "JX" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

const verifyPaymentService = async ({
  bookingId,
  paymentStatus,
  transactionId,
}) => {
  if (!bookingId) {
    throw new Error("Booking ID required");
  }

  let updatedBooking;

  
  await prisma.$transaction(async (tx) => {

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new Error("Booking not found");

    if (booking.status === "CONFIRMED") {
      updatedBooking = booking;
      return;
    }

    if (booking.status === "FAILED") {
      throw new Error("Payment already failed");
    }

    if (booking.status !== "PENDING_PAYMENT") {
      throw new Error("Invalid booking state");
    }

    if (booking.lockExpiry && new Date() > booking.lockExpiry) {
      throw new Error("Booking expired. Please try again.");
    }

    
    if (paymentStatus === "SUCCESS") {

      updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CONFIRMED",
          pnr: generatePNR(),
        },
        select: {
          id: true,
          pnr: true,
          passengerName: true,
          passengerEmail: true,   
          bookingType: true,
          totalPrice: true,
        },
      });

      await tx.payment.create({
        data: {
          bookingId,
          amount: booking.totalPrice,
          status: "SUCCESS",
          transactionId: transactionId || null,
        },
      });

      return;
    }
    if (paymentStatus === "FAILED") {

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

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "FAILED" },
      });

      await tx.payment.create({
        data: {
          bookingId,
          amount: booking.totalPrice,
          status: "FAILED",
          transactionId: transactionId || null,
        },
      });

      updatedBooking = {
        message: "Payment failed. Seat released.",
      };
    }
  });

  if (paymentStatus === "SUCCESS" && updatedBooking) {
    try {

      console.log("📩 EMAIL:", updatedBooking.passengerEmail);

      if (!updatedBooking.passengerEmail) {
        console.error("❌ Email missing in booking");
        return updatedBooking;
      }
      const filePath = await generateTicketPDF(updatedBooking);
      console.log("📄 PDF Generated:", filePath);

      const fs = require("fs");

console.log("📄 Checking file:", filePath);

if (!fs.existsSync(filePath)) {
  console.error("❌ FILE NOT FOUND BEFORE EMAIL!");
} else {
  console.log("✅ File exists, sending email...");
}
      await sendTicketEmail(
        updatedBooking.passengerEmail,
        updatedBooking,
        filePath
      );

      console.log("✅ Ticket email sent successfully");

    } catch (err) {
      console.error("❌ Email/PDF error:", err.message);
    }
  }

  return updatedBooking;
};

module.exports = {
  verifyPaymentService,
};