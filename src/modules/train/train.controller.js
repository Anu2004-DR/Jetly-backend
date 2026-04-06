const prisma = require("../../config/prisma");

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

module.exports = { getTrains };