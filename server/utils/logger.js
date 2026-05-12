// Shared helper utilities for logger operations.
const pino = require("pino");
const { config } = require("../config");

const options = {
  level: config.logging.level,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: { env: config.nodeEnv },
};
if (config.nodeEnv !== "test") {
  options.transport = {
    target: "pino-pretty",
    options: { colorize: true, translateTime: "SYS:standard" },
  };
}
const logger = pino(options);

module.exports = { logger };
