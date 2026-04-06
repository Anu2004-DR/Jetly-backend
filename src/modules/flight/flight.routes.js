const express = require("express");
const router = express.Router();

const {
  searchFlights,   // make sure this exists
} = require("./flight.controller");

// ✅ ADD THIS
router.get("/search", searchFlights);

module.exports = router;