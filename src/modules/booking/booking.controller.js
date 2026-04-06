const prisma = require("../../config/prisma");

const {
  createBookingService,
  getBookingHistoryService,
  cancelBookingService,
} = require("./booking.service");


const createBooking = async (req, res) => {
  try {
    const userId = req.userId; // 🔥 from JWT middleware

    const booking = await createBookingService({
      ...req.body,
      userId, // attach owner
    });

    return res.status(201).json({
      success: true,
      message: "Seat locked. Proceed to payment.",
      data: booking,
    });

  } catch (error) {
    console.error("BOOKING ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Booking failed",
    });
  }
};



const getBookingHistory = async (req, res) => {
  try {
    const userId = req.userId; // 🔥 secure user

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

    // 🔒 Check ownership
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
      message: "Booking cancelled successfully",
      data: cancelled,
    });

  } catch (error) {
    console.error("CANCEL ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel",
    });
  }
};



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

    //if (booking.userId !== userId) {
      //return res.status(403).json({
        //success: false,
        //message: "Unauthorized access",
      //});
    //}

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


module.exports = {
  createBooking,
  getBookingHistory,
  cancelBooking,
  getBookingById,
};