const {
  rebuildScoresForUserWithEveryone,
  rebuildScoresOfEveryoneWithUser,
} = require("../services/matchingService");

function rebuildOutgoingScoresJob(userId) {
  return rebuildScoresForUserWithEveryone(userId);
}

function rebuildIncomingScoresJob(userId) {
  return rebuildScoresOfEveryoneWithUser(userId);
}

module.exports = {
  rebuildOutgoingScoresJob,
  rebuildIncomingScoresJob,
};
