const axios = require("axios");

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
  const itinerary = flight.itineraries?.[0];
  const segment = itinerary?.segments?.[0];

  return {
    id: flight.id,

    airline:
      segment?.carrierCode || "Unknown",

    from:
      segment?.departure?.iataCode || "",

    to:
      segment?.arrival?.iataCode || "",

    departure:
      segment?.departure?.at || "",

    arrival:
      segment?.arrival?.at || "",

    duration:
      itinerary?.duration || "",

    price:
      Number(flight.price?.grandTotal || 0),

    stops:
      itinerary?.segments?.length
        ? itinerary.segments.length - 1
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

    const token = await getAccessToken();

    const response = await axios.get(
      "https://test.api.amadeus.com/v2/shopping/flight-offers",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },

        params: {
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate,
          adults,
          max: 5,
          currencyCode: "INR",
        },

        timeout: 10000,
      }
    );

    const flights =
      response.data?.data || [];

    return {
  fallback: false,
  flights: flights.map(normalizeFlight),
};

  } catch (error) {

    console.log("========== AMADEUS ERROR ==========");
console.dir(error?.response?.data, {
  depth: null,
});
console.log("==================================");

    console.log(
      "⚠️ USING MOCK FLIGHTS"
    );

    return {
  fallback: true,
  flights: mockFlights,
};
  }
};

module.exports = {
  searchFlightsService,
};