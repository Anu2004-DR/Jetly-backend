const prisma = require("../../config/prisma");
const { searchTrains } = require("./train.service");

/* ==============================
   GET ALL TRAINS
============================== */
const getTrains = async (req, res) => {
  try {
    const trains = await prisma.train.findMany();
    res.json(trains);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch trains"
    });
  }
};

/* ==============================
   SEARCH TRAINS
============================== */
const searchTrainsController = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        message: "from and to required"
      });
    }

    const trains = await searchTrains(from, to);

    res.json(trains);

  } catch (error) {
    console.error("TRAIN SEARCH ERROR:", error);
    res.status(500).json({
      message: "Failed to search trains"
    });
  }
};

module.exports = {
  getTrains,
  searchTrains: searchTrainsController
};