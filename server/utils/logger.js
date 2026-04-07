const pino = require("pino");
const { config } = require("../config");

const logger = pino({
  level: config.logging.level,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: { env: config.nodeEnv },
  transport: {
    target: "pino-pretty",
    options: { colorize: true, translateTime: "SYS:standard" },
  },
});

module.exports = { logger };
