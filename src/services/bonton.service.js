const axios = require("axios");

class BontonService {
  constructor() {
    this.baseURL = process.env.BONTON_BASE_URL;
    this.token = null;
  }

  async getToken() {
    // Add Bonton login API here once credentials arrive
  }

  async searchFlights(payload) {
    // Add search endpoint here
  }

  async fareQuote(payload) {
    // Add fare quote endpoint here
  }

  async bookFlight(payload) {
    // Add booking endpoint here
  }

  async issueTicket(payload) {
    // Add ticket endpoint here
  }
}

module.exports = new BontonService();