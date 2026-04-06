const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error("❌ Email config error:", err.message);
  } else {
    console.log("✅ Email server ready");
  }
});

/* ==============================
   TICKET EMAIL
============================== */
const sendTicketEmail = async (to, booking, filePath) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "🎫 Your JetlyXO Ticket",
      html: `
        <h2>Booking Confirmed ✅</h2>
        <p><b>PNR:</b> ${booking.pnr || "N/A"}</p>
        <p><b>Name:</b> ${booking.passengerName || "Guest"}</p>
        <p><b>Type:</b> ${booking.bookingType}</p>
        <p><b>Amount:</b> ₹${booking.totalPrice}</p>
      `,
      attachments: filePath
        ? [
            {
              filename: `JetlyXO_Ticket_${booking.id}.pdf`,
              path: filePath,
            },
          ]
        : [],
    });
  } catch (err) {
    console.error("❌ Ticket email failed:", err.message);
  }
};

/* ==============================
   CANCELLATION EMAIL
============================== */
const sendCancellationEmail = async (to, booking) => {
  try {
    const refund = booking.refundAmount || 0;

    let refundType = "No Refund";
    if (refund === booking.totalPrice) refundType = "Full Refund";
    else if (refund > 0) refundType = "Partial Refund";

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "❌ Booking Cancelled - JetlyXO",
      html: `
        <h2>Booking Cancelled</h2>

        <p><b>PNR:</b> ${booking.pnr || "N/A"}</p>
        <p><b>Name:</b> ${booking.passengerName || "Guest"}</p>

        <p><b>Status:</b> CANCELLED</p>

        <hr/>

        <p><b>Refund Amount:</b> ₹${refund}</p>
        <p><b>Refund Type:</b> ${refundType}</p>

        <p style="color: gray; font-size: 12px;">
          Refund will be processed within 5-7 working days.
        </p>

        <br/>
        <p>Thank you for choosing JetlyXO ✈️</p>
      `,
    });
  } catch (err) {
    console.error("❌ Cancellation email failed:", err.message);
  }
};

const sendOTPEmail = async (to, otp) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "Jetly OTP Verification",
      text: `Your OTP is: ${otp}. Valid for 5 minutes.`,
    });

    console.log("✅ OTP email sent");
  } catch (err) {
    console.error("❌ OTP email failed:", err.message);
    throw err;
  }
};

module.exports = {
  sendTicketEmail,
  sendCancellationEmail,
  sendOTPEmail
};