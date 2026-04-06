const { fetchTravelData } = require("../services/data/travel.service");
const { getRecommendations } = require("../services/recommendation/recommendation.service");

async function getUserRecommendations(req, res) {
  try {
    const userBookings = req.body.bookings || [];

    console.log("USER BOOKINGS:", userBookings);

    const rawData = await fetchTravelData();

    if (!rawData.length) {
      console.log("No travel data available");
      return res.json([]);
    }

    const allData = rawData.map(item => ({
      ...item,
      source: item.source || item.from,
      destination: item.destination || item.to,
      price: Number(item.price) || 0
    }));

    console.log("ALL DATA SAMPLE:", allData[0]);

    const recommendations = getRecommendations(userBookings, allData);

    console.log("FINAL RECOMMENDATIONS:", recommendations);

    res.json(recommendations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Recommendation failed" });
  }
}

module.exports = {
  getUserRecommendations
};