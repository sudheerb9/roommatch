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
    },
    {
      tableName: "chats",
      validate: {
        participantsValid() {
          if (!Array.isArray(this.participant_user_ids)) {
            throw new Error("participant_user_ids must be an array");
          }
          if (this.participant_user_ids.length < 2) {
            throw new Error(
              "participant_user_ids must include at least 2 users",
            );
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

          if (
            this.kind === "direct" &&
            this.participant_user_ids.length !== 2
          ) {
            throw new Error("direct chat must contain exactly 2 participants");
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
        },
      },
    },
  );

  return Chat;
};
