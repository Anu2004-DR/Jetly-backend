"use strict";

const express        = require("express");
const rateLimit      = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const authenticateScanner = require("../middleware/authenticateScanner");
const {
  validateTicket,
  getScanLogs,
  getBookingStatus,
} = require("../controllers/validation.controller");

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
//  RATE LIMITER
//
//  Without this an attacker with a stolen scanner token can:
//  (a) Enumerate all PNRs via brute-force
//  (b) Mark arbitrary tickets as checked-in (DoS)
//
//  30 req/min per scanner device is generous for real gate use
//  (busiest gates board ~1 passenger every 3-5 seconds).
//
//  Note: limiter runs AFTER authenticateScanner so req.scanner.id
//  is available for per-device keying (not per-IP, which breaks
//  behind NAT at airports/stations).
// ─────────────────────────────────────────────────────────────────

const scanLimiter = rateLimit({
  windowMs: 60 * 1_000,
  max:      30,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator: (req) => req.scanner?.id ?? ipKeyGenerator(req),
  handler: (_req, res) =>
    res.status(429).json({
      valid:   false,
      code:    "RATE_LIMITED",
      message: "Too many requests. Please wait before retrying.",
    }),
});

// ── ROUTES ───────────────────────────────────────────────────────

// QR scan (FAST, no auth, no limiter)
router.get("/", validateTicket);

// Secure scanner endpoint (for apps/devices)
router.post("/pnr", authenticateScanner, scanLimiter, validateTicket);

// Read-only
router.get("/status/:pnr", authenticateScanner, getBookingStatus);
router.get("/scan-logs/:bookingId", authenticateScanner, getScanLogs);

module.exports = router;
