const prisma = require("../../config/prisma");

const {
  createBookingService,
  getBookingHistoryService,
  cancelBookingService,
} = require("./booking.service");

/* =========================
   CREATE BOOKING
========================= */
const createBooking = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const booking = await createBookingService(req.body, userId);

    return res.json({
      success: true,
      booking,
    });

  } catch (error) {
    console.error("BOOKING ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   BOOKING HISTORY
========================= */
const getBookingHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const bookings = await getBookingHistoryService(userId);

    return res.status(200).json({
      success: true,
      totalBookings: bookings.length,
      data: bookings,
    });

  } catch (error) {
    console.error("BOOKING HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch booking history",
    });
  }
};

/* =========================
   CANCEL BOOKING + REFUND
========================= */
const cancelBooking = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const userId = req.userId;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    // 🔒 Ownership check
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Not your booking",
      });
    }

    const cancelled = await cancelBookingService(bookingId);

    return res.status(200).json({
      success: true,
      message: cancelled.message,
      refund: cancelled.refundAmount,
      refundId: cancelled.razorpayRefundId,
    });

  } catch (error) {
    console.error("CANCEL ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel booking",
    });
  }
};

/* =========================
   GET BOOKING BY ID
========================= */
const getBookingById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.userId;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        bus: true,
        train: true,
        flight: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: booking.id,
        pnr: booking.pnr || "PENDING",
        passengerName: booking.passengerName,
        bookingType: booking.bookingType,
        totalPrice: booking.totalPrice,
        status: booking.status,
        bus: booking.bus || null,
        train: booking.train || null,
        flight: booking.flight || null,
      },
    });

  } catch (err) {
    console.error("GET BOOKING ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching booking",
    });
  }
};

/* =========================
   EXPORTS
========================= */
module.exports = {
  createBooking,
  getBookingHistory,
  cancelBooking,
  getBookingById,
};