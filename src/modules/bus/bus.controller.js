const prisma = require("../../config/prisma");
//const { searchBuses } = require("./bus.service");


/* ==============================
   GET ALL BUSES
============================== */
const getBuses = async (req, res) => {
  try {
    const buses = await prisma.bus.findMany();
    res.json(buses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch buses" });
  }
};

/* ==============================
   SEARCH BUSES (IMPORTANT FIX)
============================== */
const searchBuses = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        message: "from and to are required"
      });
    }

    const buses = await prisma.bus.findMany({
      where: {
        fromCity: {
          contains: from,
          mode: "insensitive"
        },
        toCity: {
          contains: to,
          mode: "insensitive"
        }
      }
    });

    res.json(buses);

  } catch (error) {
    console.error("BUS SEARCH ERROR:", error);
    res.status(500).json({
      message: "Failed to search buses"
    });
  }
};

module.exports = {
  getBuses,
  searchBuses
};