const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth.middleware");
const {
  createOrder,
  verifyPayment,
} = require("./payment.controller");



router.post("/create-order", authMiddleware, createOrder);
router.post("/verify", authMiddleware, verifyPayment);

module.exports = router;