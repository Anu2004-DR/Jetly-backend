const Amadeus = require("amadeus");

console.log("CLIENT ID:", process.env.AMADEUS_CLIENT_ID);
console.log(
  "CLIENT SECRET EXISTS:",
  !!process.env.AMADEUS_CLIENT_SECRET
);

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
  hostname: "test",
});

module.exports = amadeus;