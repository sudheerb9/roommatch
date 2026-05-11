const { logger } = require("../utils/logger");

function scheduleMatchScoreRebuild(userId) {
  if (!userId) {
    return;
  }
  setImmediate(() => {
    // Lazy require avoids circular import issues during app bootstrap.
    const jobs = require("./matchingJobs");
    Promise.all([
      jobs.rebuildOutgoingScoresJob(userId),
      jobs.rebuildIncomingScoresJob(userId),
    ]).catch((err) => {
      logger.error({ err, userId }, "Match score rebuild failed");
    });
  });
}

module.exports = { scheduleMatchScoreRebuild };
