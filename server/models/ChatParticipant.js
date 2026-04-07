const { DataTypes } = require("sequelize");

/** @param {import("sequelize").Sequelize} sequelize */
module.exports = (sequelize) => {
  const ChatParticipant = sequelize.define(
    "ChatParticipant",
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
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      joined_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "chat_participants",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["chat_id", "user_id"],
          name: "chat_participants_chat_user_unique",
        },
      ],
    },
  );

  return ChatParticipant;
};
