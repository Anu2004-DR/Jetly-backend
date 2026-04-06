require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cron = require("node-cron");
const rateLimit = require("express-rate-limit");

const app = express();

/* =========================
   SECURITY + PERFORMANCE
========================= */

// 🔐 CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// 🛡️ Security headers
app.use(helmet());

// 📊 Logging
app.use(morgan("dev"));

// 📦 Body parser
app.use(express.json());

// 🚫 Rate limiting (important)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // limit each IP
  message: "Too many requests, please try again later"
});
app.use(limiter);

/* =========================
   ROUTES
========================= */

const authRoutes = require("./routes/auth.routes");
const flightRoutes = require("./modules/flight/flight.routes");
const bookingRoutes = require("./modules/booking/booking.routes");
const paymentRoutes = require("./modules/payment/payment.routes");
const busRoutes = require("./modules/bus/bus.routes");
const trainRoutes = require("./modules/train/train.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const validationRoutes = require("./routes/validation.routes");
const searchRoutes = require("./modules/search/search.routes");
const behaviorRoutes = require("./routes/behavior.routes");



/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.json({ message: "Travel Platform API Running 🚀" });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    time: new Date(),
  });
});

/* =========================
   API ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api", recommendationRoutes);
app.use("/api/validate", validationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/behavior", behaviorRoutes);
/* =========================
   TEST ROUTES
========================= */

app.post("/api/booking-test", (req, res) => {
  console.log("✅ TEST BOOKING HIT");
  res.json({ success: true });
});

app.get("/api/recommendations-test", (req, res) => {
  res.json({ ok: true });
});

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =========================
   GLOBAL ERROR HANDLER (IMPORTANT)
========================= */

app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* =========================
   CRON JOB
========================= */

const { releaseExpiredBookings } = require("./cron/bookingExpiry");

cron.schedule("* * * * *", async () => {
  console.log("⏳ Running booking expiry cron...");
  try {
    await releaseExpiredBookings();
  } catch (err) {
    console.error("CRON ERROR:", err);
  }
});

/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

/* =========================
   GRACEFUL SHUTDOWN (IMPORTANT)
========================= */

process.on("SIGINT", () => {
  console.log("🛑 Shutting down server...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});