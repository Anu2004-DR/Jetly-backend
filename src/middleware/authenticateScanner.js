// src/middleware/authenticateScanner.js
"use strict";

const jwt = require("jsonwebtoken");

// ─────────────────────────────────────────────────────────────────
//  Two token roles are accepted:
//
//  STAFF  — individual gate agents / conductors
//           { id, role: "STAFF", name, stationCode }
//           Expires: 12h (re-issued each shift)
//
//  DEVICE — physical scanner kiosks / handheld hardware
//           { deviceId, role: "DEVICE", location }
//           Expires: 365d (issued once per device)
//
//  SCANNER_JWT_SECRET must be SEPARATE from your user JWT secret.
//  A leaked user token must not grant scanner access.
// ─────────────────────────────────────────────────────────────────

const authenticateScanner = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      valid:   false,
      code:    "UNAUTHORIZED",
      message: "Scanner authentication required.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.SCANNER_JWT_SECRET);

    if (!["STAFF", "DEVICE"].includes(decoded.role)) {
      return res.status(403).json({
        valid:   false,
        code:    "FORBIDDEN",
        message: "Insufficient role for ticket validation.",
      });
    }

    // Attach to req — used for ScanLog.scannedBy and rate-limit key
    req.scanner = {
      id:       decoded.userId || decoded.deviceId,
      role:     decoded.role,
      name:     decoded.name     || decoded.location || "Unknown",
      location: decoded.stationCode || decoded.location || null,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        valid:   false,
        code:    "TOKEN_EXPIRED",
        message: "Scanner session expired. Re-authenticate to continue.",
      });
    }
    return res.status(401).json({
      valid:   false,
      code:    "INVALID_TOKEN",
      message: "Invalid scanner credentials.",
    });
  }
};

module.exports = authenticateScanner;