jest.mock("../middleware/authenticate", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 44, email: "i@test.com", is_active: true };
    next();
  },
}));

jest.mock("../models", () => ({
  sequelize: { transaction: jest.fn() },
  GroupInvitation: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  GroupMember: { findOrCreate: jest.fn() },
  Group: {},
  User: {},
}));

const express = require("express");
const request = require("supertest");
const { sequelize, GroupInvitation, GroupMember } = require("../models");
const invitationsRouter = require("../routes/invitations");

const app = express();
app.use(express.json());
app.use("/", invitationsRouter);

describe("routes/invitations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockImplementation((cb) =>
      cb({ LOCK: { UPDATE: "UPDATE" } }));
  });

  it("lists inbound invitations", async () => {
    GroupInvitation.findAll.mockResolvedValueOnce([]);
    const res = await request(app).get("/mine");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.invitations)).toBe(true);
  });

  it("validates rejection tokens", async () => {
    const res = await request(app).post("/abc/respond").send({ action: "accept" });
    expect(res.status).toBe(400);
  });

  it("lets invitees explicitly reject banners", async () => {
    const invitation = {
      id: "9",
      invitee_user_id: 44,
      inviter_user_id: 90,
      group_id: 3,
      status: "pending",
      update: jest.fn().mockResolvedValue(undefined),
      reload: jest.fn().mockResolvedValue(undefined),
    };

    GroupInvitation.findByPk.mockResolvedValue(invitation);

    const res = await request(app).post("/9/respond").send({ action: "reject" });
    expect(res.status).toBe(200);
    expect(invitation.update).toHaveBeenCalled();
  });

  it("welcomes invitees accepting during open transactions", async () => {
    const invitationShell = {
      id: "12",
      invitee_user_id: 44,
      inviter_user_id: 91,
      group_id: 5,
      status: "pending",
      update: jest.fn().mockResolvedValue(undefined),
      reload: jest.fn().mockResolvedValue(undefined),
    };

    GroupInvitation.findByPk.mockResolvedValueOnce(invitationShell);

    GroupInvitation.findOne.mockResolvedValueOnce(invitationShell);
    GroupMember.findOrCreate.mockResolvedValueOnce([{}, false]);

    const res = await request(app).post("/12/respond").send({ action: "accept" });
    expect(res.status).toBe(200);
    expect(GroupMember.findOrCreate).toHaveBeenCalled();
  });
});
