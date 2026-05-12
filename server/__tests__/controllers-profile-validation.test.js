jest.mock("../models", () => ({
  Profile: { findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
  MatchPreference: { findByPk: jest.fn(), create: jest.fn() },
  User: { findByPk: jest.fn() },
}));

const { updateMyProfile } = require("../controllers/profileController");

function resStub() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const user = { id: 8, email: "pv@test.com", display_name: "PV", is_active: true };

const validPrefs = () => ({
  preferred_sleep_schedule: "early_bird",
  preferred_cleanliness_level: "clean",
  preferred_noise_tolerance: "sensitive",
  preferred_smoking_preference: "no",
  preferred_drinking_preference: "no",
  preferred_social_behavior: "moderate",
  preferred_study_preferences: "studious",
});

const validCore = () => ({
  bio: "",
  gender: "cis_male",
  sleep_schedule: "early_bird",
  cleanliness_level: "clean",
  noise_tolerance: "sensitive",
  smoking_preference: "no",
  drinking_preference: "no",
  social_behavior: "social",
  study_preferences: "studious",
});

describe("profileController validation branches", () => {
  async function rejects(body) {
    const res = resStub();
    await updateMyProfile({ user, body }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  }

  beforeEach(() => jest.clearAllMocks());

  it("flags unknown keys", async () => {
    await rejects({ ...validPrefs(), hacker_field: true });
  });

  it("flags empty PATCH bodies", async () => {
    await rejects({});
  });

  it("needs every preference slice when altering preferences", async () => {
    await rejects({ preferred_sleep_schedule: "early_bird" });
  });

  it("needs every lifestyle field when altering profile core enums", async () => {
    await rejects({ gender: "cis_female" });
  });

  it("enforces enumerated domain values", async () => {
    await rejects({
      ...validCore(),
      gender: "alien-from-mars",
    });
    await rejects({
      ...validPrefs(),
      preferred_study_preferences: "not-real",
    });
  });

  it("caps oversized bios", async () => {
    await rejects({
      ...validCore(),
      bio: "x".repeat(2005),
    });
  });
});
