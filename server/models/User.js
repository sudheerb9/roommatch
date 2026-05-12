// Defines the User Sequelize model schema and relationships.
const { DataTypes } = require("sequelize");

/** @param {import("sequelize").Sequelize} sequelize */
module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      google_sub: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      display_name: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      password_hash: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      password_salt: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "users",
    },
  );

  return User;
};
