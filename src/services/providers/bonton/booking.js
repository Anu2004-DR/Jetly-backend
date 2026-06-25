const client = require("./client");

async function bookFlight(payload) {
  const { data } = await client.post(
    "/flight/v2/book",
    payload
  );

  return data;
}

module.exports = {
  bookFlight,
};