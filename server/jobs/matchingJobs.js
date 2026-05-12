// Schedules and runs matchingJobs background job workflows.
const {
  rebuildScoresForUserWithEveryone,
  rebuildScoresOfEveryoneWithUser,
} = require("../services/matchingService");

function rebuildOutgoingScoresJob(userId) {
  // Recompute viewer -> everyone cache.
  return rebuildScoresForUserWithEveryone(userId);
}

function rebuildIncomingScoresJob(userId) {
  // Recompute everyone -> target user cache entries.
  return rebuildScoresOfEveryoneWithUser(userId);
}

module.exports = {
  rebuildOutgoingScoresJob,
  rebuildIncomingScoresJob,
};
