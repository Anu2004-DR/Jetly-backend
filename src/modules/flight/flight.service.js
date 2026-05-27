const axios = require("axios");
const amadeus = require("../../config/amadeus");

let cachedToken = null;
let tokenExpiry = null;

const mockFlights = [
  {
    id: "MOCK-1",
    airline: "IndiGo",
    price: 5200,
    from: "DEL",
    to: "BOM",
    departure: "08:30",
    arrival: "10:45",
    duration: "2h 15m",
    stops: 0,
  },
  {
    id: "MOCK-2",
    airline: "Air India",
    price: 6100,
    from: "DEL",
    to: "BOM",
    departure: "13:15",
    arrival: "15:40",
    duration: "2h 25m",
    stops: 0,
  },
];

/* =========================
   ACCESS TOKEN
========================= */

const getAccessToken = async () => {
  try {

    // reuse token if still valid
    if (
      cachedToken &&
      tokenExpiry &&
      Date.now() < tokenExpiry
    ) {
      return cachedToken;
    }

    const response = await axios.post(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.AMADEUS_CLIENT_ID,
        client_secret: process.env.AMADEUS_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        timeout: 10000,
      }
    );

    cachedToken = response.data.access_token;

    // token valid for ~30 mins safely
    tokenExpiry =
      Date.now() +
      (response.data.expires_in - 60) * 1000;

    return cachedToken;

  } catch (error) {

    console.error(
      "AMADEUS TOKEN ERROR:",
      error?.response?.data || error.message
    );

    throw new Error("Failed to authenticate with Amadeus");
  }
};

/* =========================
   NORMALIZE RESPONSE
========================= */

const normalizeFlight = (flight) => {

  const itinerary =
    flight.itineraries?.[0];

  const segments =
    itinerary?.segments || [];

  const firstSegment = segments[0];

  const lastSegment =
    segments[segments.length - 1];

  return {
    id: flight.id,

    airline:
      firstSegment?.carrierCode || "Unknown",

    from:
      firstSegment?.departure?.iataCode || "",

    to:
      lastSegment?.arrival?.iataCode || "",

    departure:
      firstSegment?.departure?.at || "",

    arrival:
      lastSegment?.arrival?.at || "",

    duration:
      itinerary?.duration || "",

    price:
      Number(flight.price?.grandTotal || 0),

    currency:
      flight.price?.currency || "INR",

    stops:
      segments.length > 0
        ? segments.length - 1
        : 0,
  };
};

/* =========================
   SEARCH FLIGHTS
========================= */

const searchFlightsService = async ({
  origin,
  destination,
  departureDate,
  adults = 1,
}) => {

  try {

    const response =
      await amadeus.shopping.flightOffersSearch.get({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate,
        adults,
        max: 5,
        currencyCode: "INR",
      });

    const flights =
      response.data || [];

    const normalizedFlights =
  flights.map(normalizeFlight);

const filteredFlights =
  normalizedFlights.filter(
    (flight) =>
      flight.to === destination
  );

return {
  fallback: false,
  flights: filteredFlights,
};

  } catch (error) {

    console.log("========== AMADEUS ERROR ==========");

    console.dir(
      error?.response?.result || error.message,
      { depth: null }
    );

    console.log("==================================");

    console.log("⚠️ USING MOCK FLIGHTS");

    return {
      fallback: true,

      flights: mockFlights.map((flight) => ({
        ...flight,
        from: origin,
        to: destination,
      })),
    };
  }
};

module.exports = {
  searchFlightsService,
};