"use strict";

const prisma = require("../../config/prisma");
const razorpay = require("./razorpay");
const crypto = require("crypto");
const { verifyPaymentService } = require("./payment.service");

/* =========================
   CREATE ORDER (FINAL)
========================= */
exports.createOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID required",
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
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
        message: "Unauthorized booking access",
      });
    }

    // ❗ Only allow payment for pending bookings
    if (booking.status !== "PENDING_PAYMENT") {
      return res.status(400).json({
        success: false,
        message: "Booking is not eligible for payment",
      });
    }

    // ❗ Validate amount
    const amount = Math.round(Number(booking.totalPrice) * 100);
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking amount",
      });
    }

    // ✅ Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `booking_${bookingId}`,
    });

    return res.json({
      success: true,
      order,
    });

  } catch (err) {
    console.error("CREATE ORDER ERROR:", err.message, err.stack);

    return res.status(500).json({
      success: false,
      message: err.message || "Order creation failed",
    });
  }
};




exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    const numericBookingId = Number(bookingId);

    if (!numericBookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID required"
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const booking = await prisma.booking.findUnique({
      where: { id: numericBookingId }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (booking.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized booking access"
      });
    }

    // ✅ IDEMPOTENCY
    if (booking.status === "CONFIRMED") {
      return res.json({ success: true, already: true });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      await verifyPaymentService({
        bookingId: numericBookingId,
        paymentStatus: "FAILED",
        transactionId: razorpay_payment_id || null,
      });

      return res.status(400).json({
        success: false,
        message: "Invalid signature"
      });
    }

    const result = await verifyPaymentService({
      bookingId: numericBookingId,
      paymentStatus: "SUCCESS",
      transactionId: razorpay_payment_id,
    });

    res.json({ success: true, data: result });

  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Verification failed"
    });
  }
};


/* =========================
   PAYMENT FAILED HANDLER
========================= */
exports.markPaymentFailed = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID required",
      });
    }

    await prisma.booking.update({
      where: { id: Number(bookingId) },
      data: { status: "FAILED" },
    });

    return res.json({
      success: true,
      message: "Payment marked as failed",
    });

  } catch (err) {
    console.error("PAYMENT FAIL ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update payment status",
    });
  }
};
