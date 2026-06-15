const bonton = require("../../config/bonton");
const { getToken } = require("./auth");

async function searchFlights(payload) {
  const token = await getToken();

  const response = await bonton.post(
    "/flightapi/search",
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

module.exports = {
  searchFlights,
};