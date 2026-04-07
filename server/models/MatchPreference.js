const { DataTypes } = require("sequelize");

/**
 * Optional roommate preferences (desired traits). Null/missing means "no strong preference".
 *
 * @param {import("sequelize").Sequelize} sequelize
 */
module.exports = (sequelize) => {
  const MatchPreference = sequelize.define(
    "MatchPreference",
    {
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: { model: "users", key: "id" },
      },
      preferred_sleep_schedule: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      preferred_cleanliness_level: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      preferred_study_preferences: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      preferred_noise_tolerance: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      preferred_social_behavior: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
    },
    {
      tableName: "match_preferences",
    },
  );

  return MatchPreference;
};
