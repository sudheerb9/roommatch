jest.mock("../models", () => ({
  Profile: { findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
  MatchPreference: { findByPk: jest.fn(), create: jest.fn() },
  User: { findByPk: jest.fn() },
}));



const { Profile, MatchPreference, User } = require("../models");
const profileController = require("../controllers/profileController");
const { validPreferencePayload } = require("./helpers/profileFixtures");

function resMock() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("profileController", () => {
  const user = { id: BigInt("7"), email: "u@test.com", display_name: "U", is_active: true };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMyProfile", () => {
    it("responds with aggregates", async () => {
      Profile.findOne.mockResolvedValueOnce({ user_id: 7, bio: null, gender: "cis_male" });
      MatchPreference.findByPk.mockResolvedValueOnce({ user_id: 7 });

      const req = { user };
      const res = resMock();
      const next = jest.fn();

      await profileController.getMyProfile(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ matching_eligible: true }));
    });

    it("forwards Sequelize errors", async () => {
      Profile.findOne.mockRejectedValueOnce(new Error("mysql"));
      const next = jest.fn();
      await profileController.getMyProfile({ user }, resMock(), next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("updateMyProfile", () => {
    it("422-style payload errors", async () => {
      const res = resMock();
      await profileController.updateMyProfile(
        { user, body: { unknown: true } },
        res,
        jest.fn(),
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("writes preferences when valid", async () => {
      const preference = {
        update: jest.fn().mockResolvedValue(undefined),
      };
      Profile.findOne.mockResolvedValue(null);
      MatchPreference.findByPk.mockResolvedValue(preference);

      const res = resMock();
      await profileController.updateMyProfile(
        { user, body: validPreferencePayload() },
        res,
        jest.fn(),
      );
      expect(preference.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("rejects bio-only without profile baseline", async () => {
      const res = resMock();
      Profile.findOne.mockResolvedValueOnce(null);
      await profileController.updateMyProfile(
        { user, body: { bio: "hello" } },
        res,
        jest.fn(),
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getUserProfile", () => {
    it("validates numeric user id param", async () => {
      const res = resMock();
      await profileController.getUserProfile(
        { params: { userId: "abc" } },
        res,
        jest.fn(),
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("404 when missing user", async () => {
      User.findByPk.mockResolvedValueOnce(null);
      const res = resMock();
      await profileController.getUserProfile({ params: { userId: "9" } }, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns public profile snippet", async () => {
      User.findByPk.mockResolvedValueOnce({
        id: 9,
        email: "pub@test.com",
        display_name: "P",
        is_active: true,
      });
      Profile.findOne.mockResolvedValueOnce({
        user_id: 9,
        bio: null,
        gender: "cis_male",
        sleep_schedule: "early_bird",
        cleanliness_level: "clean",
        noise_tolerance: "sensitive",
        smoking_preference: "no",
        drinking_preference: "no",
        social_behavior: "social",
        study_preferences: "studious",
      });

      const res = resMock();
      await profileController.getUserProfile({ params: { userId: "9" } }, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0]).toHaveProperty("profile");
    });
  });
});
