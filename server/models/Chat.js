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
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: "direct",
      },
    },
    {
      tableName: "chats",
    },
  );

  return Chat;
};
