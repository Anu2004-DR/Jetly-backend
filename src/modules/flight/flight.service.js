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
    airline: f.airline,
    from: f.fromCity,
    to: f.toCity,
    departure: f.departure,
    arrival: f.arrival,
    departureTime: f.departure,
    arrivalTime: f.arrival,
    duration: f.duration,
    stops: f.stops,
    price: f.price,
    seats: f.seats,
    name: f.airline
  }));
};

module.exports = { searchFlights };
