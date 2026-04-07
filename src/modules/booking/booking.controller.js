const prisma = require("../../config/prisma");

const {
  createBookingService,
  getBookingHistoryService,
  cancelBookingService,
} = require("./booking.service");


const createBooking = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!req.body.bookingType) {
      return res.status(400).json({
        success: false,
        message: "Booking type required",
      });
    }

    const booking = await createBookingService(req.body, userId);

    return res.status(201).json({
      success: true,
      bookingId: booking.id,
      status: booking.status,
      data: booking,
    });

  } catch (error) {
    console.error("BOOKING ERROR:", error.message, error.stack);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create booking",
    });
  }
};
/* =========================
   BOOKING HISTORY
========================= */
const getBookingHistory = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const bookings = await getBookingHistoryService(userId);

    return res.status(200).json({
      success: true,
      totalBookings: bookings.length,
      data: bookings,
    });

  } catch (error) {
    console.error("BOOKING HISTORY ERROR:", error.message, error.stack);

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

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 🔒 Ownership check
    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Not your booking",
      });
    }

    // ❗ Status validation
    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed bookings can be cancelled",
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
    console.error("CANCEL ERROR:", error.message, error.stack);

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

    // 🔒 Ownership check
    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: booking.id,
        pnr:
          booking.status === "CONFIRMED"
            ? booking.pnr
            : null,
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
    console.error("GET BOOKING ERROR:", err.message, err.stack);

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