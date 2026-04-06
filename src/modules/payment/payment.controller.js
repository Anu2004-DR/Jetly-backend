const { verifyPaymentService } = require("./payment.service");

const pay = async (req, res) => {
  try {

    const { bookingId, paymentStatus } = req.body;

    if (!bookingId || !paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "bookingId and paymentStatus are required",
      });
    }
    

    await prisma.booking.update({
  where: { id: bookingId },
  data: {
    status: "CONFIRMED",
    pnr: "PNR" + Math.floor(Math.random() * 1000000)
  }
});
    const result = await verifyPaymentService({
      bookingId: Number(bookingId),
      paymentStatus,
      transactionId: "TXN" + Date.now(),
    });

    return res.status(200).json({
      success: true,
      message:
        paymentStatus === "SUCCESS"
          ? "Payment successful, booking confirmed"
          : "Payment failed",
      data: result,
    });

  } catch (err) {

    console.error("PAYMENT ERROR:", err);

    return res.status(400).json({
      success: false,
      message: err.message || "Payment failed",
    });
  }
};

module.exports = { pay };