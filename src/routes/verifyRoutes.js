const express = require("express");
const router = express.Router();

const bookingService = require("../modules/booking/booking.service");

router.get("/:pnr", async (req, res) => {
  try {
    const pnr = req.params.pnr;

    const bookings = await bookingService.getAllBookings?.();

    const booking = bookings?.find(
      (item) => String(item.pnr) === String(pnr)
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("VERIFY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;