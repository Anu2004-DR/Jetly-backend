const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth.middleware");

const {
  createBooking,
  getBookingHistory,
  cancelBooking,
  getBookingById,
} = require("./booking.controller");

//router.get("/history", getBookingHistory);




router.post("/", createBooking);

router.get("/history", authMiddleware, getBookingHistory);
router.get("/:id", getBookingById);

router.post("/cancel/:id", cancelBooking);

module.exports = router;