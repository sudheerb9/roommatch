jest.mock("../models", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  Session: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../middleware/authenticate", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, email: "in@test.com", display_name: "In", is_active: true };
    next();
  },
}));

jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      getPayload: () => ({
        sub: "google-1",
        email: "g@test.com",
        name: "G User",
      }),
    }),
  })),
}));

const express = require("express");
const request = require("supertest");
const { User, Session } = require("../models");
const authRouter = require("../routes/auth");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRouter);
  return app;
}

describe("routes/auth", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers new accounts", async () => {
    User.findOne.mockResolvedValueOnce(null);
    const created = { id: 22, email: "a@b.com", display_name: "AB" };
    User.create.mockResolvedValueOnce(created);
    Session.create.mockResolvedValueOnce({});

    const res = await request(app).post("/auth/register").send({
      email: "a@b.com",
      password: "secret12",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("a@b.com");
  });

  it("rejects duplicate emails", async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    const res = await request(app).post("/auth/register").send({
      email: "dup@test.com",
      password: "secret12",
    });
    expect(res.status).toBe(409);
  });

  it("rejects bad passwords", async () => {
    const authUtils = require("../utils/auth");
    const { salt, hash } = authUtils.createPasswordHash("good-password");

    User.findOne.mockResolvedValueOnce({
      id: 5,
      email: "x@test.com",
      display_name: "X",
      password_hash: hash,
      password_salt: salt,
    });

    const res = await request(app).post("/auth/login").send({
      email: "x@test.com",
      password: "bad-password",
    });

    expect(res.status).toBe(401);
  });

  it("returns profile for /auth/me", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("in@test.com");
  });

  it("validates credential payloads during registration", async () => {
    const res = await request(app).post("/auth/register").send({ email: "only@test.com" });
    expect(res.status).toBe(400);
  });

  it("validates credential payloads during login", async () => {
    const res = await request(app).post("/auth/login").send({ password: "nope" });
    expect(res.status).toBe(400);
  });

  it("handles Google SSO bootstrap", async () => {
    User.findOne.mockResolvedValueOnce(null);
    User.findOne.mockResolvedValueOnce(null);
    const created = {
      id: 31,
      email: "g@test.com",
      display_name: "G User",
    };
    User.create.mockResolvedValueOnce(created);

    const res = await request(app).post("/auth/callback").send({
      credential: "mock-google-jwt",
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("g@test.com");
    expect(typeof res.body.token).toBe("string");
  });

  it("merges Google SSO into legacy accounts", async () => {
    const legacyUser = {
      id: 40,
      email: "overlap@test.com",
      display_name: "Overlap",
      update: jest.fn().mockResolvedValue(undefined),
    };
    User.findOne.mockResolvedValueOnce(null);
    User.findOne.mockResolvedValueOnce(legacyUser);

    const res = await request(app).post("/auth/callback").send({
      credential: "mock-google-jwt",
    });

    expect(res.status).toBe(200);
    expect(legacyUser.update).toHaveBeenCalled();
  });

  it("treats logout as idempotent acknowledgement", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});
