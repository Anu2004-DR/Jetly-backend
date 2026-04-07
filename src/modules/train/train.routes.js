const express = require("express");
const router = express.Router();

const { getTrains, searchTrains } = require("./train.controller");

/* GET ALL */
router.get("/", getTrains);

/* 🔍 SEARCH */
router.get("/search", searchTrains);

module.exports = router;