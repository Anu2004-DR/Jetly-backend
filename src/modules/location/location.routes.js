const express = require("express");
const router = express.Router();
const { fetchTravelData } = require("../../services/data/travel.service");

// 🔍 Autocomplete API
router.get("/search", async (req, res) => {
  const { q } = req.query;

  if (!q) return res.json([]);

  const data = await fetchTravelData();

  const results = data
    .filter(item =>
      item.source.toLowerCase().includes(q.toLowerCase()) ||
      item.destination.toLowerCase().includes(q.toLowerCase())
    )
    .map(item => item.source);

  res.json([...new Set(results)].slice(0, 5));
});

module.exports = router;