const prisma = require("../../config/prisma");
const searchTrains = async (from, to, date) => {
  return [
    {
      id: "train_1",
      type: "TRAIN",
      provider: "MOCK",
      from,
      to,
      departureTime: `${date}T06:00:00`,
      arrivalTime: `${date}T12:00:00`,
      price: 1200,
      name: "Shatabdi Express"
    }
  ];
};

module.exports = { searchTrains };