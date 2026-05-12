jest.mock("../middleware/authenticate", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 8, email: "r@test.com", is_active: true, display_name: "R" };
    next();
  },
}));

jest.mock("../models", () => ({
  Profile: {
    findOne: jest.fn(),
  },
  MatchPreference: {
    findByPk: jest.fn(),
  },
}));

const express = require("express");
const request = require("supertest");
const { Profile, MatchPreference } = require("../models");
const profileRouter = require("../routes/profile");

const app = express();
app.use(express.json());
app.use("/", profileRouter);

describe("routes/profile", () => {
  beforeEach(() => {
    Profile.findOne.mockResolvedValue({
      user_id: 8,
      gender: "cis_male",
      sleep_schedule: "early_bird",
      cleanliness_level: "clean",
      noise_tolerance: "sensitive",
      smoking_preference: "no",
      drinking_preference: "no",
      social_behavior: "social",
      study_preferences: "studious",
      bio: null,
    });
    MatchPreference.findByPk.mockResolvedValue({
      user_id: 8,
      preferred_sleep_schedule: "early_bird",
    });
  });

  it("responds to GET /me", async () => {
    const res = await request(app).get("/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("r@test.com");
  });
});
