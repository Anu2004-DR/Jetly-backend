const bonton = require("../../config/bonton");

let token = null;
let expiresAt = null;

async function getToken() {
  if (
    token &&
    expiresAt &&
    new Date(expiresAt) > new Date()
  ) {
    return token;
  }

  const { data } = await bonton.post(
    "/auth/v2/auth",
    {
      apiKey: process.env.BONTON_API_KEY,
      secretKey: process.env.BONTON_SECRET_KEY,
    }
  );

  token = data.token;
  expiresAt = data.expiresAt;

  return token;
}

module.exports = {
  getToken,
};