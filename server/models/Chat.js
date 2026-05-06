const { DataTypes } = require("sequelize");

/** @param {import("sequelize").Sequelize} sequelize */
module.exports = (sequelize) => {
  const Chat = sequelize.define(
    "Chat",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      kind: {
        type: DataTypes.ENUM("direct", "group"),
        allowNull: false,
        defaultValue: "direct",
      },
      participant_user_ids: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      direct_chat_key: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
      },
    },
    {
      tableName: "chats",
      validate: {
        participantsValid() {
          if (!Array.isArray(this.participant_user_ids)) {
            throw new Error("participant_user_ids must be an array");
          }

          const seen = new Set();
          for (const userId of this.participant_user_ids) {
            const numericId = Number(userId);
            if (!Number.isInteger(numericId) || numericId <= 0) {
              throw new Error(
                "participant_user_ids must contain positive integer user ids",
              );
            }
            if (seen.has(numericId)) {
              throw new Error(
                "participant_user_ids must not contain duplicates",
              );
            }
            seen.add(numericId);
          }

          if (this.kind === "direct" && this.participant_user_ids.length !== 2) {
            throw new Error("direct chat must contain exactly 2 participants");
          }
          if (this.kind === "group" && this.participant_user_ids.length < 1) {
            throw new Error("group chat must contain at least 1 participant");
          }

          if (this.kind === "direct" && !this.direct_chat_key) {
            throw new Error("direct_chat_key is required for direct chats");
          }
        },
      },
      hooks: {
        beforeValidate(chat) {
          if (Array.isArray(chat.participant_user_ids)) {
            chat.participant_user_ids = [...chat.participant_user_ids]
              .map((id) => Number(id))
              .sort((a, b) => a - b);
          }

          if (
            chat.kind === "direct" &&
            Array.isArray(chat.participant_user_ids) &&
            chat.participant_user_ids.length === 2
          ) {
            chat.direct_chat_key = `${chat.participant_user_ids[0]}:${chat.participant_user_ids[1]}`;
          }
        },
      },
      indexes: [
        {
          name: "chats_direct_chat_key_idx",
          fields: ["direct_chat_key"],
          unique: true,
        },
      ],
    },
  );

  return Chat;
};
