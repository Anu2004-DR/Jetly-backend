const express = require("express");

const router = express.Router();

const { getBuses } = require("./bus.controller");

router.get("/", getBuses);

module.exports = router;