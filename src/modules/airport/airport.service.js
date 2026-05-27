const amadeus = require("../../config/amadeus");

// local Indian airport fallback database
const localAirports = [
  {
    name: "Kempegowda International Airport",
    iataCode: "BLR",
    city: "Bengaluru",
    country: "India",
    countryCode: "IN",
  },
  {
    name: "Chhatrapati Shivaji International Airport",
    iataCode: "BOM",
    city: "Mumbai",
    country: "India",
    countryCode: "IN",
  },
  {
    name: "Indira Gandhi International Airport",
    iataCode: "DEL",
    city: "New Delhi",
    country: "India",
    countryCode: "IN",
  },
  {
    name: "Chennai International Airport",
    iataCode: "MAA",
    city: "Chennai",
    country: "India",
    countryCode: "IN",
  },
  {
    name: "Netaji Subhas Chandra Bose Airport",
    iataCode: "CCU",
    city: "Kolkata",
    country: "India",
    countryCode: "IN",
  },
];

// aliases
const cityAliases = {
  bangalore: "bengaluru",
  banglore: "bengaluru",
  bang: "bengaluru",
  bombay: "mumbai",
  mum: "mumbai",
  del: "new delhi",
  calcutta: "kolkata",
  madras: "chennai",
};

const searchAirportsService = async (keyword) => {

  try {

    const normalizedKeyword =
      keyword.trim().toLowerCase();

    let searchKeyword = normalizedKeyword;

    // alias replacement
    for (const alias in cityAliases) {

      if (
        normalizedKeyword.includes(alias) ||
        alias.includes(normalizedKeyword)
      ) {
        searchKeyword = cityAliases[alias];
        break;
      }
    }

    /* =========================
       LOCAL MATCHES FIRST
    ========================= */

    const localMatches =
      localAirports.filter((airport) => {

        return (
          airport.city
            .toLowerCase()
            .includes(searchKeyword) ||

          airport.iataCode
            .toLowerCase()
            .includes(searchKeyword) ||

          airport.name
            .toLowerCase()
            .includes(searchKeyword)
        );
      });

    /* =========================
       AMADEUS SEARCH
    ========================= */

    let apiResults = [];

    try {

      const response =
        await amadeus.referenceData.locations.get({
          keyword: searchKeyword,

          subType: "AIRPORT,CITY",

          "page[limit]": 10,

          sort: "analytics.travelers.score",
        });

      apiResults =
        response.data.map((item) => ({
          name: item.name,

          iataCode: item.iataCode,

          city:
            item.address?.cityName || "",

          country:
            item.address?.countryName || "",

          countryCode:
            item.address?.countryCode || "",
        }));

    } catch (apiError) {

      console.log(
        "AMADEUS AIRPORT SEARCH FAILED"
      );
    }

    /* =========================
       MERGE + REMOVE DUPLICATES
    ========================= */

    const mergedResults = [
      ...localMatches,
      ...apiResults,
    ];

    const uniqueResults =
      mergedResults.filter(
        (airport, index, self) => {

          return (
            index ===
            self.findIndex(
              (a) =>
                a.iataCode ===
                airport.iataCode
            )
          );
        }
      );

    return uniqueResults;

  } catch (error) {

    console.error(
      "AIRPORT SEARCH ERROR:",
      error.message
    );

    throw new Error(
      "Failed to fetch airport data"
    );
  }
};

module.exports = {
  searchAirportsService,
};