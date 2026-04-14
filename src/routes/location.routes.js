const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json([]);
    }

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query,
          format: "json",
          addressdetails: 1,
          limit: 6,
        },
        headers: {
          "User-Agent": "jetly-app",
        },
      }
    );

    const results = response.data.map((place) => ({
      id: place.place_id,
      name: place.display_name,
      lat: place.lat,
      lon: place.lon,
    }));

    res.json(results);
  } catch (error) {
    console.error("Location API Error:", error.message);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

module.exports = router;
