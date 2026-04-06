const express = require("express");
const router = express.Router();

const { pay } = require("./payment.controller");


router.post("/verify", pay);

module.exports = router;