const express = require("express");

const router = express.Router();

const {
  searchFlights,
} = require("./flight.controller");

// GET /api/flights/search
router.get("/search", searchFlights);

module.exports = router;