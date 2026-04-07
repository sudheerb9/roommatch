const { DataTypes } = require("sequelize");

/**
 * Self-reported lifestyle fields used for roommate compatibility scoring.
 * Values validated at the API layer; stored as short strings for flexibility.
 *
 * @param {import("sequelize").Sequelize} sequelize
 */
module.exports = (sequelize) => {
  const Profile = sequelize.define(
    "Profile",
    {
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: { model: "users", key: "id" },
      },
      sleep_schedule: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      cleanliness_level: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      study_preferences: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      noise_tolerance: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      social_behavior: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "profiles",
    },
  );

  return Profile;
};
