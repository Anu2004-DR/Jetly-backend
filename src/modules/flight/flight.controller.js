const {
  searchFlightsService,
} = require("./flight.service");

const searchFlights = async (req, res) => {
  try {

    const {
      origin,
      destination,
      departureDate,
      adults = 1,
    } = req.query;

    // Validation
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        message:
          "origin, destination and departureDate are required",
      });
    }

    const flights =
      await searchFlightsService({
        origin,
        destination,
        departureDate,
        adults,
      });

    return res.json({
      success: true,
      count: flights.length,
      data: flights,
    });

  } catch (error) {

  console.log("========== FULL ERROR ==========");
  console.dir(error, { depth: null });
  console.log("================================");

  return res.status(500).json({
    success: false,
    message: error?.message || "Unknown error",
    statusCode: error?.response?.statusCode || null,
    amadeusError: error?.response?.result || null,
  });
}
};

module.exports = {
  searchFlights,
};