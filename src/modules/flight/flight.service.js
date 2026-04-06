const prisma = require("../../config/prisma");
const amadeus = require("../../config/amadeus");


const normalizeAmadeusFlights = (data) => {
  return data.map(f => {
    const seg = f.itineraries[0].segments[0];

    return {
      id: f.id,
      airline: f.validatingAirlineCodes?.[0] || "N/A",
      from: seg.departure.iataCode,
      to: seg.arrival.iataCode,
      departure: seg.departure.at,
      arrival: seg.arrival.at,
      price: Number(f.price.total),
      duration: f.itineraries[0].duration,
      stops: f.itineraries[0].segments.length - 1,
      source: "amadeus"
    };
  });
};


const searchFlights = async (from, to, date) => {
  try {
    console.log("🔍 Step 1: Searching DB...");

    const dbFlights = await prisma.flight.findMany({
      where: {
        fromCity: { contains: from, mode: "insensitive" },
        toCity: { contains: to, mode: "insensitive" }
      },
      orderBy: { price: "asc" }
    });

    if (dbFlights.length > 0) {
      console.log(`✅ Found ${dbFlights.length} flights in DB`);
      return dbFlights.map(f => ({ ...f, source: "database" }));
    }

    console.log("🌍 No DB results → Calling Amadeus...");

    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate: date,
      adults: "1",
    });

    console.log("✅ Amadeus Response received");

    return normalizeAmadeusFlights(response.data);

  } catch (error) {
    console.error("❌ Amadeus Error:", error.response?.data || error.message);
    throw error;
  }
};


const getFlightById = async (id) => {
  return prisma.flight.findUnique({
    where: { id: Number(id) }
  });
};

module.exports = { searchFlights, getFlightById };