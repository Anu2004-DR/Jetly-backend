const {
  searchAirportsService,
} = require("./airport.service");

const searchAirports = async (
  req,
  res
) => {

  try {

    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message:
          "Keyword is required",
      });
    }

    const airports =
      await searchAirportsService(
        keyword
      );

    return res.json({
      success: true,
      count: airports.length,
      data: airports,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch airports",
    });
  }
};

module.exports = {
  searchAirports,
};