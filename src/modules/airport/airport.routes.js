const express = require("express");

const router = express.Router();

const {
  searchAirports,
} = require("./airport.controller");

router.get(
  "/search",
  searchAirports
);

module.exports = router;