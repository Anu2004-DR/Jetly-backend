const prisma = require("../../config/prisma");


const getBuses = async (req, res) => {

  try {

    const buses = await prisma.bus.findMany();

    res.json(buses);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch buses"
    });

  }

};

module.exports = {
  getBuses
};