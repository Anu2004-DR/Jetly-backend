const axios = require("axios");

module.exports = axios.create({
  baseURL: process.env.BONTON_BASE_URL,
  timeout: 30000,
});