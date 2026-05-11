jest.mock("../utils/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock("../jobs/matchingJobs", () => ({
  rebuildOutgoingScoresJob: jest.fn().mockResolvedValue(undefined),
  rebuildIncomingScoresJob: jest.fn().mockResolvedValue(undefined),
}));

const jobs = require("../jobs/matchingJobs");
const { logger } = require("../utils/logger");
const { scheduleMatchScoreRebuild } = require("../jobs/scheduleMatchScoreRebuild");

describe("scheduleMatchScoreRebuild", () => {
  beforeEach(() => jest.clearAllMocks());

  it("skips enqueue when falsy identifiers arrive", () => {
    scheduleMatchScoreRebuild(undefined);
    expect(jobs.rebuildOutgoingScoresJob).not.toHaveBeenCalled();
  });

  it("kickstarts async rebuild pair", async () => {
    scheduleMatchScoreRebuild(12);
    await new Promise((resolve) => setImmediate(resolve));
    expect(jobs.rebuildOutgoingScoresJob).toHaveBeenCalledWith(12);
    expect(jobs.rebuildIncomingScoresJob).toHaveBeenCalledWith(12);
  });

  it("logs rejected Promise.all outcomes", async () => {
    jobs.rebuildOutgoingScoresJob.mockRejectedValueOnce(new Error("fail"));
    scheduleMatchScoreRebuild(3);

    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));

    expect(logger.error).toHaveBeenCalled();
  });
});
