const express = require("express");
const router = express.Router();

const { getBuses, searchBuses } = require("./bus.controller");

/* GET ALL */
router.get("/", getBuses);

/* 🔍 SEARCH */
router.get("/search", searchBuses);

module.exports = router;