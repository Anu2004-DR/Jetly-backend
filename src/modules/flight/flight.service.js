const axios = require("axios");

const mockFlights = [
  {
    id: "MOCK-1",
    airline: "IndiGo",
    price: "₹5,200",
    from: "DEL",
    to: "BOM",
    departure: "08:30",
    arrival: "10:45",
    duration: "2h 15m",
  },
  {
    id: "MOCK-2",
    airline: "Air India",
    price: "₹6,100",
    from: "DEL",
    to: "BOM",
    departure: "13:15",
    arrival: "15:40",
    duration: "2h 25m",
  },
];

const getAccessToken = async () => {

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
    }
  );

  return response.data.access_token;
};

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
          currencyCode: "USD",
        },
      }
    );

    return response.data.data;

  } catch (error) {

    console.error(
      "AMADEUS FAILED → USING MOCK DATA"
    );

    return mockFlights;
  }
};

module.exports = {
  searchFlightsService,
};