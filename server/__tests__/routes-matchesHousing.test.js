jest.mock("../middleware/authenticate", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 8, email: "r@test.com", is_active: true, display_name: "R" };
    next();
  },
}));

jest.mock("../services/matchingService", () => ({
  isMatchingEligible: jest.fn().mockResolvedValue(false),
  getMatchedUsersForUser: jest.fn(),
}));

jest.mock("../models", () => ({
  HousingUnit: {
    findAll: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  },
  Profile: {
    findOne: jest.fn().mockResolvedValue(null),
  },
  MatchPreference: {
    findByPk: jest.fn().mockResolvedValue(null),
  },
}));

const express = require("express");
const request = require("supertest");
const matchesRouter = require("../routes/matches");
const housingRouter = require("../routes/housingUnits");

function mount(router) {
  const app = express();
  app.use(express.json());
  app.use("/", router);
  return app;
}

describe("matches & housing routes", () => {
  it("returns match payload wrapper", async () => {
    const res = await request(mount(matchesRouter)).get("/");
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it("lists inventory pages", async () => {
    const res = await request(mount(housingRouter)).get("/?available=true");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
