const { createClient } = require("redis");
const { config } = require("../config");
const { logger } = require("./logger");

const redisClient = createClient({ url: config.redis.url });
let connectPromise = null;

redisClient.on("error", (err) => {
  logger.error({ err }, "Redis client error");
});

function ensureRedisConnected() {
  if (redisClient.isOpen) {
    return Promise.resolve(redisClient);
  }
  if (!connectPromise) {
    // Share one connect attempt across callers during startup races.
    connectPromise = redisClient.connect().then(() => redisClient);
  }
  return connectPromise;
}

module.exports = {
  redisClient,
  ensureRedisConnected,
};
