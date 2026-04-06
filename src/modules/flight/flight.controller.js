const prisma = require("../../config/prisma");

exports.searchFlights = async (req, res) => {
  try {
    const { from, to } = req.query;

    const flights = await prisma.flight.findMany({
      where: {
        from: {
          contains: from || "",
          mode: "insensitive",
        },
        to: {
          contains: to || "",
          mode: "insensitive",
        },
      },
    });

    res.json({
      success: true,
      flights,
    });

  } catch (err) {
    console.error("FLIGHT SEARCH ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to search flights",
    });
  }
};