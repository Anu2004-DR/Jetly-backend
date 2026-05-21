require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cron = require("node-cron");
const rateLimit = require("express-rate-limit");
const http = require("http");

const app = express();

/* ======================================================
   HTTP SERVER
====================================================== */

const server = http.createServer(app);

/* ======================================================
   SOCKET.IO (FOR STREAMING CHAT)
====================================================== */

const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:3000",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

/* ======================================================
   SECURITY + PERFORMANCE
====================================================== */

// 🔐 CORS
app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:3000",
    credentials: true,
  })
);

// 🛡️ Helmet
app.use(helmet());

// 📊 Logger
app.use(morgan("dev"));

// 📦 JSON Parser
app.use(express.json());

// 📦 URL Encoded
app.use(express.urlencoded({ extended: true }));

/* ======================================================
   GLOBAL RATE LIMITER
====================================================== */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message:
    "Too many requests, please try again later.",
});

app.use(limiter);

/* ======================================================
   AI RATE LIMITER
====================================================== */

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message:
    "Too many AI requests, please try later.",
});

/* ======================================================
   ROUTES
====================================================== */

const authRoutes = require("./routes/auth.routes");

const flightRoutes = require(
  "./modules/flight/flight.routes"
);

const bookingRoutes = require(
  "./modules/booking/booking.routes"
);

const paymentRoutes = require(
  "./modules/payment/payment.routes"
);

const busRoutes = require(
  "./modules/bus/bus.routes"
);

const trainRoutes = require(
  "./modules/train/train.routes"
);

const recommendationRoutes = require(
  "./routes/recommendation.routes"
);

const validationRoutes = require(
  "./routes/validation.routes"
);

const searchRoutes = require(
  "./modules/search/search.routes"
);

const behaviorRoutes = require(
  "./routes/behavior.routes"
);

const locationRoutes = require(
  "./modules/location/location.routes"
);

const verifyRoutes = require(
  "./routes/verifyRoutes"
);

const aiRoutes = require("./routes/ai.routes");

/* ======================================================
   ROOT ROUTES
====================================================== */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Jetly API Running 🚀",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

/* ======================================================
   API ROUTES
====================================================== */

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

app.use("/api/location", locationRoutes);

app.use("/api/verify", verifyRoutes);

// 🤖 AI ROUTES
app.use("/api/ai", aiLimiter, aiRoutes);



app.post("/api/booking-test", (req, res) => {
  console.log("✅ TEST BOOKING HIT");

  res.json({
    success: true,
  });
});

app.get("/api/recommendations-test", (req, res) => {
  res.json({
    ok: true,
  });
});



app.get("/api/test-token", async (req, res) => {
  try {
    const axios = require("axios");

    const response = await axios.post(
      "https://test.api.amadeus.com/v1/security/oauth2/token",

      new URLSearchParams({
        grant_type: "client_credentials",

        client_id:
          process.env.AMADEUS_CLIENT_ID,

        client_secret:
          process.env.AMADEUS_CLIENT_SECRET,
      }),

      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
      }
    );

    res.json(response.data);

  } catch (err) {

    console.error(
      "AMADEUS ERROR:",
      err?.response?.data || err
    );

    res.status(500).json({
      success: false,
      error:
        err?.response?.data || err.message,
    });
  }
});



app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});



app.use((err, req, res, next) => {

  console.error("❌ SERVER ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message:
      err.message || "Internal Server Error",
  });
});



const {
  releaseExpiredBookings,
} = require("./cron/bookingExpiry");

cron.schedule("* * * * *", async () => {

  console.log(
    "⏳ Running booking expiry cron..."
  );

  try {
    await releaseExpiredBookings();

  } catch (err) {

    console.error(
      "CRON ERROR:",
      err.message
    );
  }
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {

  console.log(`
🚀 Jetly Server Running
🌍 PORT: ${PORT}
🤖 AI Enabled
⚡ WebSocket Enabled
✅ Environment: ${process.env.NODE_ENV}
  `);
});



process.on("SIGINT", () => {

  console.log("🛑 Shutting down server...");

  server.close(() => {

    console.log("✅ Server closed");

    process.exit(0);
  });
});