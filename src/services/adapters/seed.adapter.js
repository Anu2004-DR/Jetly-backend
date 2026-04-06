const prisma = require("../../config/prisma");
const {
  normalizeFlight,
  normalizeBus,
  normalizeTrain
} = require("../../utils/normalizer");

async function getAllTravelData() {
  const flights = await prisma.flight.findMany();
  const buses = await prisma.bus.findMany();
  const trains = await prisma.train.findMany();

  return [
    ...flights.map(normalizeFlight),
    ...buses.map(normalizeBus),
    ...trains.map(normalizeTrain)
  ];
}

module.exports = {
  getAllTravelData
};