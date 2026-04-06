// src/controllers/validation.controller.js
"use strict";

const { validateAndCheckIn } = require("../services/validation.service");
const prisma = require("../lib/prisma");

// ─────────────────────────────────────────────────────────────────
//  POST /api/validate/pnr
//
//  Called by the scanner app immediately after reading a QR code.
//  Body: { pnr: "PNR8472910" }
//
//  Always returns HTTP 200 with a structured body.
//  The scanner UI reads `valid` (boolean) and `code` (string).
//
//  Why always 200?
//  Non-2xx triggers automatic retries in most HTTP clients.
//  BOOKING_CANCELLED is a business outcome, not a transport error —
//  retrying it is wrong. Keep HTTP status codes for HTTP concerns.
// ─────────────────────────────────────────────────────────────────

const validateTicket = async (req, res) => {
  const pnr = req.query.pnr || req.body.pnr;

  if (!pnr || typeof pnr !== "string" || !pnr.trim()) {
    return res.status(400).json({
      valid:   false,
      code:    "INVALID_REQUEST",
      message: "PNR is required.",
    });
  }

  const meta = {
    ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
    userAgent: req.headers["user-agent"] || null,
  };

  console.time("VALIDATION_TOTAL");

const result = await validateAndCheckIn(
  pnr.trim().toUpperCase(),
  req.scanner?.id ?? "UNKNOWN",
  meta
);

console.timeEnd("VALIDATION_TOTAL");

  return res.status(200).json(result);
};

// ─────────────────────────────────────────────────────────────────
//  GET /api/validate/scan-logs/:bookingId
//
//  Full scan audit trail for a booking.
//  Used by ops/admin for dispute resolution.
// ─────────────────────────────────────────────────────────────────

const getScanLogs = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const logs = await prisma.scanLog.findMany({
      where:   { bookingId },
      orderBy: { createdAt: "desc" },
      select: {
        id:        true,
        scannedBy: true,
        result:    true,
        reason:    true,
        ipAddress: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ bookingId, total: logs.length, logs });
  } catch (err) {
    console.error("[ValidationController] getScanLogs error:", err.message);
    return res.status(500).json({ error: "Failed to fetch scan logs." });
  }
};

// ─────────────────────────────────────────────────────────────────
//  GET /api/validate/status/:pnr
//
//  Lightweight status check — does NOT mark as checked-in.
//  Used by ops dashboards and admin panels.
// ─────────────────────────────────────────────────────────────────

const getBookingStatus = async (req, res) => {
  const { pnr } = req.params;

  try {
    const booking = await prisma.booking.findUnique({
      where:  { pnr: pnr.toUpperCase() },
      select: {
        id:            true,
        pnr:           true,
        passengerName: true,
        bookingType:   true,
        fromCity:      true,
        toCity:        true,
        date:          true,
        time:          true,
        status:        true,
        checkedIn:     true,
        checkedInAt:   true,
        checkInCount:  true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    return res.status(200).json({ booking });
  } catch (err) {
    console.error("[ValidationController] getBookingStatus error:", err.message);
    return res.status(500).json({ error: "Failed to fetch booking status." });
  }
};

module.exports = { validateTicket, getScanLogs, getBookingStatus };