const prisma = require("../../config/prisma");

const searchFlights = async (from, to, date) => {
  const flights = await prisma.flight.findMany({
    where: {
      fromCity: from,
      toCity: to
    }
  });

  return flights.map(f => ({
    id: f.id,
    type: "FLIGHT",
    provider: "MOCK",
    from: f.fromCity,
    to: f.toCity,
    departureTime: f.departureTime,
    arrivalTime: f.arrivalTime,
    price: f.price,
    name: f.airline
  }));
};

module.exports = { searchFlights };