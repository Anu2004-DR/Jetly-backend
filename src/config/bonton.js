const axios = require("axios");

const bonton = axios.create({
  baseURL: process.env.BONTON_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

module.exports = bonton;