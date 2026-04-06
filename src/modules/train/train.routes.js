const express = require("express");
const router = express.Router();

const { getTrains } = require("./train.controller");

router.get("/", getTrains);

module.exports = router;