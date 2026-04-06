const prisma = require("../../config/prisma");
const razorpay = require("./razorpay");
const crypto = require("crypto");
const { verifyPaymentService } = require("./payment.service");

exports.createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
    });

    if (!booking) throw new Error("Booking not found");

    const order = await razorpay.orders.create({
      amount: booking.totalPrice * 100,
      currency: "INR",
      receipt: `receipt_${bookingId}`,
    });

    res.json({
      success: true,
      order,
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};


exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    // 🔐 Signature verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new Error("Payment verification failed");
    }

    // ✅ CALL YOUR SERVICE (you already built this ✔)
    const result = await verifyPaymentService({
      bookingId: Number(bookingId),
      paymentStatus: "SUCCESS",
      transactionId: razorpay_payment_id,
    });

    res.json({
      success: true,
      message: "Payment verified & booking confirmed",
      data: result,
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};