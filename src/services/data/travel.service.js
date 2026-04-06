const { getAllTravelData } = require("../adapters/seed.adapter");
// const { getAllTravelDataFromAPI } = require("../adapters/api.adapter");

async function fetchTravelData() {
  // 🔁 Switch here later
  return await getAllTravelData();

  // future:
  // return await getAllTravelDataFromAPI();
}

module.exports = {
  fetchTravelData
};