require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cron = require("node-cron");



const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));


const authRoutes = require("./routes/auth.routes");
const flightRoutes = require("./modules/flight/flight.routes");
const bookingRoutes = require("./modules/booking/booking.routes");
const paymentRoutes = require("./modules/payment/payment.routes");
const busRoutes = require("./modules/bus/bus.routes");
const trainRoutes = require("./modules/train/train.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const validationRoutes = require("./routes/validation.routes");

app.get("/", (req, res) => {
  res.json({ message: "Travel Platform API Running 🚀" });
});


app.use("/api/auth", authRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api", recommendationRoutes);
app.use("/api/validate", validationRoutes);



app.post("/api/booking-test", (req, res) => {
  console.log("✅ TEST BOOKING HIT");
  res.json({ success: true });
});

app.get("/api/recommendations-test", (req, res) => {
  res.json({ ok: true });
});


app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});


app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    message: "Internal Server Error",
  });
});


const { releaseExpiredBookings } = require("./cron/bookingExpiry");

cron.schedule("* * * * *", async () => {
  console.log("⏳ Running booking expiry cron...");
  await releaseExpiredBookings();
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});