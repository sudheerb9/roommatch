const jwt = require("jsonwebtoken");
const { config } = require("../config");

function generateBearerToken(user) {
  if (!user || !user.email) {
    throw new Error("generateBearerToken requires a user object with email");
  }

  return jwt.sign(
    {
      // `sub` is the stable lookup key used by auth middleware.
      sub: user.email,
      iss: "roommatch-api",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    },
    config.auth.jwtSecret,
    { algorithm: "HS256" },
  );
}

function verifyBearerToken(token) {
  return jwt.verify(token, config.auth.jwtSecret, {
    algorithms: ["HS256"],
    issuer: "roommatch-api",
  });
}

module.exports = {
  generateBearerToken,
  verifyBearerToken,
};
