const express = require("express");
const router = express.Router();

const {
  getUserRecommendations
} = require("../controllers/recommendation.controller");

router.post("/recommendations", (req, res, next) => {
  console.log("🔥 HIT /api/recommendations");
  console.log("BODY:", req.body);

  if (!req.body.bookings || !Array.isArray(req.body.bookings)) {
    return res.status(400).json({
      error: "Invalid bookings data"
    });
  }

  next();
}, getUserRecommendations);

module.exports = router;