jest.mock("../utils/redisClient");

const { ensureRedisConnected } = require("../utils/redisClient");

jest.mock("../models", () => ({
  User: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
  Profile: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
  MatchPreference: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
}));

const { User, Profile, MatchPreference } = require("../models");
const matchingService = require("../services/matchingService");

function fullNoPreferenceViewer() {
  return {
    preferred_sleep_schedule: "no_preference",
    preferred_cleanliness_level: "no_preference",
    preferred_noise_tolerance: "no_preference",
    preferred_smoking_preference: "no_preference",
    preferred_drinking_preference: "no_preference",
    preferred_social_behavior: "no_preference",
    preferred_study_preferences: "no_preference",
  };
}

describe("matchingService", () => {
  const redis = {
    del: jest.fn().mockResolvedValue(1),
    zAdd: jest.fn().mockResolvedValue(1),
    zRem: jest.fn().mockResolvedValue(1),
    zRangeWithScores: jest.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    redis.del.mockResolvedValue(1);
    redis.zAdd.mockResolvedValue(1);
    redis.zRem.mockResolvedValue(1);
    redis.zRangeWithScores.mockResolvedValue([]);
    ensureRedisConnected.mockResolvedValue(redis);
  });

  describe("computeMatchScore", () => {
    it("is neutral when viewer uses no_preference defaults", () => {
      expect(matchingService.computeMatchScore(fullNoPreferenceViewer(), {})).toBe(100);
    });

    it("responds to mismatched lifestyle fields vs strict preferences", () => {
      const score = matchingService.computeMatchScore(
        {
          preferred_sleep_schedule: "early_bird",
          preferred_cleanliness_level: "clean",
        },
        { sleep_schedule: "night_owl", cleanliness_level: "average" },
      );
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(100);

      expect(
        matchingService.computeMatchScore({ preferred_noise_tolerance: "moderate" }, {
          noise_tolerance: "moderate",
        }),
      ).toBe(100);
    });
  });

  describe("Redis reads", () => {
    it("maps zRangeWithScores payloads", async () => {
      redis.zRangeWithScores.mockResolvedValueOnce([{ value: "5", score: "88.5" }]);
      await expect(
        matchingService.getMatchedUserIdsAndScores(1, { offset: 0, limit: 5 }),
      ).resolves.toEqual([{ userId: 5, score: "88.5" }]);
    });
  });

  describe("isMatchingEligible", () => {
    it("false without user or profile", async () => {
      User.findByPk.mockResolvedValueOnce(null);
      await expect(matchingService.isMatchingEligible(1)).resolves.toBe(false);

      User.findByPk.mockResolvedValueOnce({ id: 1 });
      Profile.findOne.mockResolvedValueOnce(null);
      await expect(matchingService.isMatchingEligible(1)).resolves.toBe(false);
    });

    it("true with active user and profile row", async () => {
      User.findByPk.mockResolvedValueOnce({ id: 1, is_active: true });
      Profile.findOne.mockResolvedValueOnce({ user_id: 1 });
      await expect(matchingService.isMatchingEligible(1)).resolves.toBe(true);
    });
  });

  describe("getMatchedUsersForUser", () => {
    it("hydrates Redis hits respecting eligibility + Sequelize users", async () => {
      redis.zRangeWithScores.mockResolvedValueOnce([{ value: "22", score: "92" }]);

      Profile.findAll.mockResolvedValueOnce([{ user_id: 22 }]);
      User.findAll
        .mockResolvedValueOnce([{ id: 22, is_active: true }])
        .mockResolvedValueOnce([{ id: 22, display_name: "A", email: "a@test.com", is_active: true }]);

      const out = await matchingService.getMatchedUsersForUser(1, {
        offset: 0,
        limit: 10,
      });
      expect(out).toHaveLength(1);
      expect(out[0].user_id).toBe(22);
    });

    it("drops Redis-backed ids if eligibility filter removes them all", async () => {
      redis.zRangeWithScores.mockResolvedValueOnce([{ value: "9", score: "81" }]);
      User.findAll.mockResolvedValueOnce([]);
      Profile.findAll.mockResolvedValueOnce([]);
      User.findAll.mockResolvedValueOnce([]);

      await expect(
        matchingService.getMatchedUsersForUser(1, { offset: 0, limit: 5 }),
      ).resolves.toEqual([]);
    });

    it("early exit when Redis returns nothing", async () => {
      redis.zRangeWithScores.mockResolvedValueOnce([]);
      await expect(
        matchingService.getMatchedUsersForUser(1, { offset: 0, limit: 10 }),
      ).resolves.toEqual([]);
      expect(User.findAll).not.toHaveBeenCalled();
    });
  });

  describe("rebuildScoresForUserWithEveryone", () => {
    it("wiped when viewer ineligible", async () => {
      User.findByPk.mockResolvedValueOnce(null);
      const out = await matchingService.rebuildScoresForUserWithEveryone(9);
      expect(out.skipped).toBe(true);
      expect(redis.del).toHaveBeenCalled();
    });
  });

  describe("rebuildScoresOfEveryoneWithUser", () => {
    it("returns early without target profile row", async () => {
      MatchPreference.findAll.mockResolvedValue([]);
      Profile.findByPk.mockResolvedValue(null);
      await expect(matchingService.rebuildScoresOfEveryoneWithUser(1)).resolves.toMatchObject({
        viewersUpdated: 0,
      });
    });

    it("clears caches when target user is inactive", async () => {
      User.findByPk.mockResolvedValueOnce(null);
      MatchPreference.findAll.mockResolvedValue([
        { user_id: 9, preferred_sleep_schedule: "no_preference" },
      ]);

      const out = await matchingService.rebuildScoresOfEveryoneWithUser(404);
      expect(out.cleared).toBe(true);
      expect(redis.del).toHaveBeenCalled();
    });
  });
});
