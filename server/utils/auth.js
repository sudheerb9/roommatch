// Shared helper utilities for auth operations.
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { config } = require("../config");

function createPasswordHash(password) {
  // Store per-user salt so identical passwords do not share hashes.
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, storedHash) {
  if (!salt || !storedHash) {
    return false;
  }
  const calculatedHash = crypto.scryptSync(password, salt, 64).toString("hex");
  // Constant-time comparison reduces timing side-channel leakage.
  return crypto.timingSafeEqual(
    Buffer.from(calculatedHash, "hex"),
    Buffer.from(storedHash, "hex"),
  );
}

function createSessionToken() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(32).toString("hex");
}

function signSessionToken(sessionToken) {
  return jwt.sign({ sessionToken }, config.auth.jwtSecret, {
    algorithm: "HS256",
    expiresIn: "7d",
  });
}

function verifySessionToken(token) {
  return jwt.verify(token, config.auth.jwtSecret, {
    algorithms: ["HS256"],
  });
}

module.exports = {
  createPasswordHash,
  verifyPassword,
  createSessionToken,
  signSessionToken,
  verifySessionToken,
};
