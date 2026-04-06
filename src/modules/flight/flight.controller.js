const { searchFlights } = require("./flight.service");

exports.searchFlightsController = async (req, res) => {
  try {
    const { from, to, date } = req.body;

    if (!from || !to || !date) {
      return res.status(400).json({
        message: "from, to, date required"
      });
    }

    console.log("📥 Request:", { from, to, date });

    const flights = await searchFlights(from, to, date);

    res.json({
      success: true,
      count: flights.length,
      flights
    });

  } catch (error) {
    console.error("❌ Controller Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Flight search failed"
    });
  }
};