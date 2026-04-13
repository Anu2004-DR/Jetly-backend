const { fetchTravelData } = require("../services/data/travel.service");
const { getRecommendations } = require("../services/recommendation/recommendation.service");

async function getUserRecommendations(req, res) {
  try {
    const userBookings = req.body.bookings || [];

    const rawData = await fetchTravelData();

    const allData = rawData.map(item => ({
      source: item.source || item.from,
      destination: item.destination || item.to,
      price: Number(item.price) || 0
    }));

    const recommendations = getRecommendations(userBookings, allData);

    res.json(recommendations);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Recommendation failed" });
  }
}

module.exports = { getUserRecommendations };