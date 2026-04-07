const { DataTypes } = require("sequelize");

/** @param {import("sequelize").Sequelize} sequelize */
module.exports = (sequelize) => {
  const Message = sequelize.define(
    "Message",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      chat_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "chats", key: "id" },
      },
      sender_user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      receipts: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      tableName: "messages",
      updatedAt: false,
      validate: {
        receiptsValid() {
          if (!Array.isArray(this.receipts)) {
            throw new Error("receipts must be an array");
          }

          const seen = new Set();
          for (const receipt of this.receipts) {
            if (!receipt || typeof receipt !== "object") {
              throw new Error("each receipt must be an object");
            }

            const readBy = Number(receipt.read_by);
            if (!Number.isInteger(readBy) || readBy <= 0) {
              throw new Error("receipt.read_by must be a user id");
            }

            if (
              !receipt.read_at ||
              Number.isNaN(new Date(receipt.read_at).getTime())
            ) {
              throw new Error("receipt.read_at must be a valid timestamp");
            }

            if (seen.has(readBy)) {
              throw new Error(
                "receipts must not contain duplicate read_by values",
              );
            }
            seen.add(readBy);
          }
        },
      },
      hooks: {
        beforeValidate(message) {
          if (!Array.isArray(message.receipts)) {
            return;
          }

          message.receipts = message.receipts
            .map((receipt) => ({
              read_by: Number(receipt.read_by),
              read_at: new Date(receipt.read_at).toISOString(),
            }))
            .sort((a, b) => a.read_by - b.read_by);
        },
      },
      indexes: [
        {
          fields: ["chat_id", "created_at"],
          name: "messages_chat_id_created_at_idx",
        },
      ],
    },
  );

  return Message;
};
