jest.mock("../services/matchingService", () => ({
  rebuildScoresForUserWithEveryone: jest.fn().mockResolvedValue({ ok: true }),
  rebuildScoresOfEveryoneWithUser: jest.fn().mockResolvedValue({ ok: true }),
}));

const matchingService = require("../services/matchingService");
const {
  rebuildOutgoingScoresJob,
  rebuildIncomingScoresJob,
} = require("../jobs/matchingJobs");

describe("matchingJobs", () => {
  it("plumbs user ids down to rebuilding routines", async () => {
    await rebuildOutgoingScoresJob(5);
    await rebuildIncomingScoresJob(99);

    expect(matchingService.rebuildScoresForUserWithEveryone).toHaveBeenCalledWith(5);
    expect(matchingService.rebuildScoresOfEveryoneWithUser).toHaveBeenCalledWith(99);
  });
});
