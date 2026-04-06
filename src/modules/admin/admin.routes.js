const express = require("express");
const router = express.Router();

const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");
const {
  getAllBookings,
  updateBookingStatus,
} = require("./admin.controller");

router.get("/bookings", authenticate, authorize("ADMIN"), getAllBookings);

router.patch(
  "/bookings/:id",
  authenticate,
  authorize("ADMIN"),
  updateBookingStatus
);

module.exports = router;