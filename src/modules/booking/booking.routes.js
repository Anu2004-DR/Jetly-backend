const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth.middleware");

const {
  createBooking,
  getBookingHistory,
  cancelBooking,
  getBookingById,
} = require("./booking.controller");


router.post("/", authMiddleware, createBooking);

router.get("/history", authMiddleware, getBookingHistory);

router.get("/:id", authMiddleware, getBookingById);

router.post("/cancel/:id", authMiddleware, cancelBooking);

module.exports = router;