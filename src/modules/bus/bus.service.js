const prisma = require("../../config/prisma");
const searchBuses = async (from, to, date) => {
  return [
    {
      id: "bus_1",
      type: "BUS",
      provider: "MOCK",
      from,
      to,
      departureTime: `${date}T22:00:00`,
      arrivalTime: `${date}T06:00:00`,
      price: 800,
      name: "VRL Travels"
    }
  ];
};

module.exports = { searchBuses };