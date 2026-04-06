const { searchFlights } = require("../flight/flight.service");
const { searchTrains } = require("../train/train.service");
const { searchBuses } = require("../bus/bus.service");

exports.searchController = async (req, res) => {
  try {
    const { type, from, to, date } = req.query;

    if (!type || !from || !to || !date) {
      return res.status(400).json({
        message: "type, from, to, date required"
      });
    }

    let results = [];

    if (type === "flight") {
      results = await searchFlights(from, to, date);
    } else if (type === "train") {
      results = await searchTrains(from, to, date);
    } else if (type === "bus") {
      results = await searchBuses(from, to, date);
    } else {
      return res.status(400).json({
        message: "Invalid type"
      });
    }

    res.json({
      success: true,
      count: results.length,
      data: results
    });

  } catch (error) {
    console.error("SEARCH ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Search failed"
    });
  }
};