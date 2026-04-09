const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

function readEnv(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    if (arguments.length < 2) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return defaultValue;
  }
  return raw;
}

function readBool(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return defaultValue;
  }
  return ["1", "true", "yes", "on"].includes(String(raw).toLowerCase());
}

const nodeEnv = readEnv("NODE_ENV", "development");

const config = {
  nodeEnv,
  port: parseInt(readEnv("PORT", "3000"), 10),
  logging: {
    level: readEnv("LOG_LEVEL", nodeEnv === "development" ? "debug" : "info"),
  },
  auth: {
    jwtSecret: readEnv("AUTH_JWT_SECRET", "roommatch-dev-secret"),
  },
  redis: {
    url: readEnv("REDIS_URL", "redis://127.0.0.1:6379"),
  },
  matching: {
    threshold: parseInt(readEnv("MATCHING_THRESHOLD", "80"), 10),
  },
  db: {
    host: readEnv("DB_HOST", "127.0.0.1"),
    port: parseInt(readEnv("DB_PORT", "3306"), 10),
    name: readEnv("DB_NAME", "roommatch"),
    user: readEnv("DB_USER", "root"),
    password: readEnv("DB_PASSWORD", ""),
    sync: readBool("DB_SYNC", nodeEnv === "development"),
    syncAlter: readBool("DB_SYNC_ALTER", nodeEnv === "development"),
    queryLogging: readBool("DB_QUERY_LOGGING", nodeEnv === "development"),
  },
};

module.exports = { config };
