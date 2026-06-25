const axios = require("axios");
const amadeus = require("../../config/amadeus");
const bontonSearch = require("../../services/providers/bonton/search");
const normalizeBonton = require("../../services/providers/bonton/normalize");

const FLIGHT_PROVIDER =
  process.env.FLIGHT_PROVIDER || "AMADEUS";

let cachedToken = null;
let tokenExpiry = null;

/* =========================
   MOCK FLIGHTS
========================= */

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
    seats: 12,
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
    seats: 8,
  },
  {
    id: "MOCK-3",
    airline: "Vistara",
    price: 7300,
    from: "DEL",
    to: "BOM",
    departure: "18:00",
    arrival: "21:20",
    duration: "3h 20m",
    stops: 1,
    seats: 3,
  },
];

/* =========================
   ACCESS TOKEN
========================= */

const getAccessToken = async () => {
  try {
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

    tokenExpiry =
      Date.now() +
      (response.data.expires_in - 60) * 1000;

    return cachedToken;
  } catch (error) {
    console.error(
      "AMADEUS TOKEN ERROR:",
      error?.response?.data || error.message
    );

    throw new Error(
      "Failed to authenticate with Amadeus"
    );
  }
};

/* =========================
   NORMALIZE RESPONSE
========================= */
const formatDuration = (duration) => {
  if (!duration) return "";

  const match = duration.match(
    /PT(?:(\d+)H)?(?:(\d+)M)?/
  );

  if (!match) return duration;

  const hours = match[1] || 0;
  const minutes = match[2] || 0;

  return `${hours ? `${hours}h ` : ""}${
    minutes ? `${minutes}m` : ""
  }`.trim();
};

const normalizeFlight = (flight) => {
  const itinerary =
    flight.itineraries?.[0];

  const segments =
    itinerary?.segments || [];

  const firstSegment =
    segments[0];

  const lastSegment =
    segments[segments.length - 1];

  const airlineMap = {
    AI: "Air India",
    "6E": "IndiGo",
    UK: "Vistara",
    SG: "SpiceJet",
  };

  return {
    id: flight.id,

    airline:
      airlineMap[
        firstSegment?.carrierCode
      ] ||
      firstSegment?.carrierCode ||
      "Unknown Airline",

    from:
      firstSegment?.departure?.iataCode || "",

    to:
      lastSegment?.arrival?.iataCode || "",

    departure:
      firstSegment?.departure?.at || "",

    arrival:
      lastSegment?.arrival?.at || "",

    duration: formatDuration(
  itinerary?.duration
),

    price:
      Number(
        flight.price?.grandTotal || 0
      ),

    currency:
      flight.price?.currency || "INR",

    stops:
      segments.length > 0
        ? segments.length - 1
        : 0,

    seats:
      Math.floor(
        Math.random() * 15
      ) + 1,
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
    /* =========================
       BONTON PROVIDER
    ========================= */

    if (FLIGHT_PROVIDER.toUpperCase() === "BONTON") {

  const payload = {
    org: origin,
    dst: destination,
    ddt: departureDate,
    rdt: "",
    cbcls: "Economy",
    fartyp: "Regular",
    adt: adults,
    chd: 0,
    inf: 0,
    mcty: [],
    tid: "",
  };

  const response = await bontonSearch.searchFlights(payload);

  return {
    fallback: false,
    provider: "BONTON",
    flights: normalizeBonton(response),
  };
}

    /* =========================
       AMADEUS PROVIDER
    ========================= */

    const response =
      await amadeus.shopping.flightOffersSearch.get(
        {
          originLocationCode:
            origin,
          destinationLocationCode:
            destination,
          departureDate,
          adults,
          max: 10,
          currencyCode: "INR",
        }
      );

    const flights =
      response.data || [];

    const normalizedFlights =
      flights.map(
        normalizeFlight
      );

    const filteredFlights =
      normalizedFlights.filter(
        (flight) =>
          flight.to === destination
      );

    return {
      fallback: false,
      provider: "AMADEUS",
      flights: filteredFlights,
    };
  } catch (error) {
    console.log(
      "========== FLIGHT SEARCH ERROR =========="
    );

    console.dir(
      error?.response?.result ||
        error.message,
      { depth: null }
    );

    console.log(
      "========================================="
    );

    console.log(
      "⚠️ USING MOCK FLIGHTS"
    );

    return {
      fallback: true,
      provider: "MOCK",
      flights:
        mockFlights.map(
          (flight) => ({
            ...flight,
            from: origin,
            to: destination,
          })
        ),
    };
  }
};

module.exports = {
  searchFlights: async (from, to, date) => {
    const result = await searchFlightsService({
      origin: from,
      destination: to,
      departureDate: date,
      adults: 1,
    });

    return result.flights;
  },

  searchFlightsService,
};