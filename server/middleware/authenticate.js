const { User } = require("../models");
const { verifyBearerToken } = require("../utils/authToken");
const { logger } = require("../utils/logger");

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}

async function authenticate(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = verifyBearerToken(token);
    // Token subject stores user email; resolve to current DB user each request.
    if (!payload.sub || typeof payload.sub !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findOne({ where: { email: payload.sub } });
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = user;

    return next();
  } catch (err) {
    logger.error(err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = {
  extractBearerToken,
  authenticate,
};
