const bonton = require("../../../config/bonton");

let token = null;
let expiresAt = null;
let authPromise = null;

// Refresh token 5 minutes before expiry
const REFRESH_BUFFER = 5 * 60 * 1000;

/**
 * Returns true if the cached token is still valid.
 */
function isTokenValid() {
  if (!token || !expiresAt) return false;

  const expiryTime = new Date(expiresAt).getTime();

  return expiryTime - REFRESH_BUFFER > Date.now();
}

/**
 * Requests a new token from Bonton.
 */
async function authenticate() {
  try {
    console.log("[Bonton] Generating new authentication token...");

    const { data } = await bonton.post("/auth/v2/auth", {
      apiKey: process.env.BONTON_API_KEY,
      secretKey: process.env.BONTON_SECRET_KEY,
    });

    if (!data?.status || !data?.token) {
      throw new Error(
        data?.message || "Bonton authentication failed."
      );
    }

    token = data.token;
    expiresAt = data.expiresAt;

    console.log(
      `[Bonton] Token generated successfully. Expires at ${expiresAt}`
    );

    return token;
  } catch (error) {
    console.error(
      "[Bonton] Authentication Error:",
      error.response?.data || error.message
    );

    token = null;
    expiresAt = null;

    throw error;
  }
}

/**
 * Returns a valid JWT token.
 * Uses cached token whenever possible.
 */
async function getToken() {
  if (isTokenValid()) {
    return token;
  }

  // Prevent multiple authentication requests
  if (authPromise) {
    return authPromise;
  }

  authPromise = authenticate();

  try {
    const newToken = await authPromise;
    return newToken;
  } finally {
    authPromise = null;
  }
}

/**
 * Clears the cached token.
 * Useful during testing.
 */
function clearToken() {
  token = null;
  expiresAt = null;
}

/**
 * Returns token expiry information.
 */
function getTokenInfo() {
  return {
    token,
    expiresAt,
    valid: isTokenValid(),
  };
}

module.exports = {
  getToken,
  clearToken,
  getTokenInfo,
};