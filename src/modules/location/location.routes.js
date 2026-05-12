const express = require("express");

const router = express.Router();

const axios = require("axios");

/* ---------------- GET ACCESS TOKEN ---------------- */

async function getAccessToken() {

  const response = await axios.post(
    "https://test.api.amadeus.com/v1/security/oauth2/token",

    new URLSearchParams({
      grant_type: "client_credentials",

      client_id:
        process.env.AMADEUS_CLIENT_ID,

      client_secret:
        process.env.AMADEUS_CLIENT_SECRET,
    }),

    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data.access_token;
}


/* ---------------- AIRPORT AUTOCOMPLETE ---------------- */

router.get("/search", async (req, res) => {

  try {

    const keyword = req.query.q;

    if (!keyword) {

      return res.json([]);
    }

    const token =
      await getAccessToken();

    const response = await axios.get(
  "https://test.api.amadeus.com/v1/reference-data/locations",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },

    params: {
      keyword,
      subType: "CITY",
      "page[limit]": 10,
      view: "LIGHT",
    },
  }
);
console.log(
  JSON.stringify(
    response.data,
    null,
    2
  )
);

    const formatted = response.data.data.map(
  (loc) => ({
    id: loc.id,

    name: loc.name,

    iata: loc.iataCode,

    city:
      loc.address?.cityName,

    country:
      loc.address?.countryName,

    type: loc.subType,
  })
);

res.json(formatted);

  } catch (err) {

    console.error(
      "LOCATION SEARCH ERROR:",
      err.response?.data ||
      err.message
    );

    res.status(500).json([]);
  }
});

module.exports = router;