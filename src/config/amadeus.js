const Amadeus = require("amadeus");

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET,
});

console.log("✅ Amadeus client initialized");

module.exports = amadeus;