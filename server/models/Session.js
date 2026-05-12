// Defines the Session Sequelize model schema and relationships.
const { DataTypes } = require("sequelize");

/** @param {import("sequelize").Sequelize} sequelize */
module.exports = (sequelize) => {
  const Session = sequelize.define(
    "Session",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      session_token: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      is_revoked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "sessions",
    },
  );

  return Session;
};
