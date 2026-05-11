const express = require("express");
const { Op, UniqueConstraintError } = require("sequelize");

const { Chat, Message, User } = require("../models");

const router = express.Router();

function parsePositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function normalizeParticipantIds(participantUserIds) {
  if (!Array.isArray(participantUserIds)) {
    return null;
  }

  const normalized = [];
  const seen = new Set();

  for (const rawId of participantUserIds) {
    const parsed = parsePositiveInt(rawId);
    if (!parsed || seen.has(parsed)) {
      return null;
    }
    seen.add(parsed);
    normalized.push(parsed);
  }

  // Canonical ordering keeps equality checks and unique keys stable.
  return normalized.sort((a, b) => a - b);
}

function asChatResponse(chat) {
  return {
    id: chat.id,
    kind: chat.kind,
    participant_user_ids: chat.participant_user_ids,
    created_at: chat.createdAt,
    updated_at: chat.updatedAt,
  };
}

function asMessageResponse(message) {
  return {
    id: message.id,
    chat_id: message.chat_id,
    sender_user_id: message.sender_user_id,
    body: message.body,
    created_at: message.createdAt,
  };
}

router.post("/", async function createOrReturnDirectChat(req, res, next) {
  try {
    const initiatorUserId = parsePositiveInt(req.body.initiator_user_id);
    const recipientUserId = parsePositiveInt(req.body.recipient_user_id);

    if (!initiatorUserId || !recipientUserId) {
      return res.status(400).json({
        error: "initiator_user_id and recipient_user_id must be positive integers",
      });
    }

    if (initiatorUserId === recipientUserId) {
      return res.status(400).json({
        error: "initiator_user_id and recipient_user_id must be different users",
      });
    }

    const existingUsersCount = await User.count({
      where: { id: { [Op.in]: [initiatorUserId, recipientUserId] } },
    });
    if (existingUsersCount !== 2) {
      return res.status(404).json({
        error: "One or both users do not exist",
      });
    }

    const participantUserIds = [initiatorUserId, recipientUserId].sort(
      (a, b) => a - b,
    );
    // Direction-agnostic key guarantees one direct chat per user pair.
    const directChatKey = `${participantUserIds[0]}:${participantUserIds[1]}`;

    let chat = await Chat.findOne({
      where: { kind: "direct", direct_chat_key: directChatKey },
    });

    let created = false;

    if (!chat) {
      try {
        chat = await Chat.create({
          kind: "direct",
          participant_user_ids: participantUserIds,
          direct_chat_key: directChatKey,
        });
        created = true;
      } catch (error) {
        // Concurrent create race: second request can safely fetch the winner row.
        if (!(error instanceof UniqueConstraintError)) {
          throw error;
        }

        chat = await Chat.findOne({
          where: { kind: "direct", direct_chat_key: directChatKey },
        });
      }
    }

    if (!chat) {
      return res.status(500).json({
        error: "Unable to create or fetch chat thread",
      });
    }

    return res.status(created ? 201 : 200).json({ chat: asChatResponse(chat), created });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/groups",
  async function createGroupChat(req, res, next) {
    try {
      const participantUserIds = normalizeParticipantIds(
        req.body.participant_user_ids,
      );

      if (!participantUserIds) {
        return res.status(400).json({
          error:
            "participant_user_ids must be an array of unique positive integers",
        });
      }

      if (participantUserIds.length < 3) {
        return res.status(400).json({
          error: "group chat requires at least 3 participants",
        });
      }

      const existingUsersCount = await User.count({
        where: { id: { [Op.in]: participantUserIds } },
      });
      if (existingUsersCount !== participantUserIds.length) {
        return res.status(404).json({
          error: "One or more users do not exist",
        });
      }

      const chat = await Chat.create({
        kind: "group",
        participant_user_ids: participantUserIds,
      });

      return res.status(201).json({ chat: asChatResponse(chat), created: true });
    } catch (error) {
      return next(error);
    }
  },
);

router.get("/:chatId/messages", async function listMessages(req, res, next) {
  try {
    const chatId = parsePositiveInt(req.params.chatId);
    const userId = parsePositiveInt(req.query.user_id);

    if (!chatId || !userId) {
      return res.status(400).json({
        error: "chatId and user_id must be positive integers",
      });
    }

    const chat = await Chat.findByPk(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Enforce participant-level access at read time.
    if (!chat.participant_user_ids.includes(userId)) {
      return res.status(403).json({ error: "User is not a participant of this chat" });
    }

    const messages = await Message.findAll({
      where: { chat_id: chat.id },
      order: [["created_at", "ASC"]],
    });

    return res.status(200).json({
      chat: asChatResponse(chat),
      messages: messages.map(asMessageResponse),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/:chatId/messages", async function sendMessage(req, res, next) {
  try {
    const chatId = parsePositiveInt(req.params.chatId);
    const senderUserId = parsePositiveInt(req.body.sender_user_id);
    const body =
      typeof req.body.body === "string"
        ? req.body.body.trim()
        : "";

    if (!chatId || !senderUserId || !body) {
      return res.status(400).json({
        error: "chatId, sender_user_id, and non-empty body are required",
      });
    }

    const chat = await Chat.findByPk(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (!chat.participant_user_ids.includes(senderUserId)) {
      return res.status(403).json({ error: "Sender is not a participant of this chat" });
    }

    const message = await Message.create({
      chat_id: chat.id,
      sender_user_id: senderUserId,
      body,
      receipts: [],
    });

    return res.status(201).json({ message: asMessageResponse(message) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
