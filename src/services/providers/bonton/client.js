const axios = require("axios");
const {
  getToken,
  clearToken,
} = require("./auth");

const client = axios.create({
  baseURL: process.env.BONTON_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Request Interceptor
 * Automatically attaches Bearer Token.
 */
client.interceptors.request.use(
  async (config) => {
    const token = await getToken();

    config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * Retries once if token has expired.
 */
client.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      console.log("[Bonton] Token expired. Refreshing...");

      clearToken();

      const newToken = await getToken();

      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return client(originalRequest);
    }

    return Promise.reject(error);
  }
);

module.exports = client;