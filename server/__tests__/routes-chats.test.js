jest.mock("../models", () => ({
  Chat: { findOne: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
  Message: { findAll: jest.fn(), create: jest.fn() },
  User: { count: jest.fn() },
}));

const express = require("express");
const request = require("supertest");
const { UniqueConstraintError } = require("sequelize");
const { Chat, Message, User } = require("../models");
const chatsRouter = require("../routes/chats");

const app = express();
app.use(express.json());
app.use("/", chatsRouter);

describe("routes/chats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a direct DM row", async () => {
    User.count.mockResolvedValueOnce(2);
    Chat.findOne.mockResolvedValueOnce(null);
    Chat.create.mockResolvedValueOnce({
      id: 77,
      kind: "direct",
      participant_user_ids: [1, 2],
      direct_chat_key: "1:2",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).post("/").send({
      initiator_user_id: "1",
      recipient_user_id: "2",
    });

    expect(res.status).toBe(201);
  });

  it("surfaces uniqueness races as idempotent lookups", async () => {
    User.count.mockResolvedValueOnce(2);
    Chat.findOne.mockResolvedValueOnce(null);
    const err = Object.assign(new UniqueConstraintError({}), {});
    Chat.create.mockRejectedValueOnce(err);
    Chat.findOne.mockResolvedValueOnce({
      id: 9,
      kind: "direct",
      participant_user_ids: [5, 6],
      direct_chat_key: "5:6",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).post("/").send({
      initiator_user_id: "5",
      recipient_user_id: "6",
    });

    expect(res.status).toBe(200);
  });

  it("validates DM participant pairs", async () => {
    const res = await request(app).post("/").send({});
    expect(res.status).toBe(400);

    const self = await request(app).post("/").send({
      initiator_user_id: "9",
      recipient_user_id: "9",
    });
    expect(self.status).toBe(400);

    User.count.mockResolvedValueOnce(1);
    const missing = await request(app).post("/").send({
      initiator_user_id: "10",
      recipient_user_id: "11",
    });
    expect(missing.status).toBe(404);
  });

  it("supports group chats with >=3 occupants", async () => {
    User.count.mockResolvedValueOnce(4);
    Chat.create.mockResolvedValueOnce({
      id: 501,
      kind: "group",
      participant_user_ids: [7, 8, 9, 11],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).post("/groups").send({
      participant_user_ids: [11, 7, 9, 8],
    });

    expect(res.status).toBe(201);
  });

  it("blocks messages sent by outsiders", async () => {
    Chat.findByPk.mockResolvedValueOnce({
      id: 4,
      participant_user_ids: [1, 2],
      createdAt: new Date(),
      updatedAt: new Date(),
      kind: "direct",
    });

    const res = await request(app).post("/4/messages").send({
      sender_user_id: "999",
      body: "spam",
    });
    expect(res.status).toBe(403);
  });

  it("persists transcripts for participants", async () => {
    Chat.findByPk.mockResolvedValueOnce({
      id: 77,
      participant_user_ids: [5, 6],
      createdAt: new Date(),
      updatedAt: new Date(),
      kind: "direct",
    });

    Message.create.mockResolvedValueOnce({
      id: 1,
      chat_id: 77,
      sender_user_id: 6,
      body: "hi",
      createdAt: new Date(),
    });

    const res = await request(app).post("/77/messages").send({
      sender_user_id: "6",
      body: " hi ",
    });

    expect(res.status).toBe(201);
  });

  it("rejects malformed transcript queries", async () => {
    const res = await request(app).get("/3/messages");
    expect(res.status).toBe(400);
  });

  it("lists chat transcripts with membership guard", async () => {
    Chat.findByPk.mockResolvedValueOnce({
      id: 3,
      participant_user_ids: [9],
      createdAt: new Date(),
      updatedAt: new Date(),
      kind: "direct",
    });
    Message.findAll.mockResolvedValueOnce([]);

    const res = await request(app).get("/3/messages?user_id=9");
    expect(res.status).toBe(200);
  });
});
