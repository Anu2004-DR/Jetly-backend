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

    // ❗ Prevent duplicate order creation
    if (booking.razorpayOrderId) {
      return res.json({
        success: true,
        message: "Order already exists",
        order: {
          id: booking.razorpayOrderId,
          amount: Math.round(booking.totalPrice * 100),
          currency: "INR",
        },
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

    // 💾 Save orderId (idempotency)
    await prisma.booking.update({
      where: { id: booking.id },
      data: { razorpayOrderId: order.id },
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

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      await prisma.booking.update({
        where: { id: Number(bookingId) },
        data: { status: "FAILED" }
      });

      return res.status(400).json({
        success: false,
        message: "Invalid signature"
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) }
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    // ✅ IDEMPOTENCY
    if (booking.status === "CONFIRMED") {
      return res.json({ success: true, already: true });
    }

    await prisma.booking.update({
      where: { id: Number(bookingId) },
      data: {
        status: "CONFIRMED",
        paymentId: razorpay_payment_id,
        pnr: booking.pnr || generatePNR()
      }
    });

    res.json({ success: true });

  } catch (e) {
    console.error(e);
    res.status(500).json({
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