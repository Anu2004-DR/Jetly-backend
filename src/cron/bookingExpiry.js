const prisma = require("../config/prisma");

const releaseExpiredBookings = async () => {
  try {
    const now = new Date();

    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING_PAYMENT",
        lockExpiry: {
          lt: now,
        },
      },
    });

    if (expiredBookings.length === 0) {
      console.log("No expired bookings");
      return;
    }

    console.log(`Found ${expiredBookings.length} expired bookings`);

    for (const booking of expiredBookings) {

      await prisma.$transaction(async (tx) => {

        /* -------- RESTORE SEATS -------- */

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

        /* -------- MARK EXPIRED -------- */

        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "EXPIRED" },
        });

      });

      console.log(`Booking ${booking.id} expired & seats restored`);
    }

  } catch (error) {
    console.error("CRON ERROR:", error.message);
  }
};

module.exports = { releaseExpiredBookings };