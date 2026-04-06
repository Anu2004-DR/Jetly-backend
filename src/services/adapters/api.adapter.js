async function getAllTravelDataFromAPI() {
  const response = await fetch("https://api.example.com/travel");
  const data = await response.json();

  // normalize here later
  return data;
}

module.exports = {
  getAllTravelDataFromAPI
};