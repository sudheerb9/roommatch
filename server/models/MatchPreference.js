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
        type: DataTypes.ENUM("early_bird", "night_owl", "no_preference"),
        allowNull: true,
      },
      preferred_cleanliness_level: {
        type: DataTypes.ENUM(
          "clean",
          "average",
          "relaxed",
          "no_preference",
        ),
        allowNull: true,
      },
      preferred_noise_tolerance: {
        type: DataTypes.ENUM(
          "sensitive",
          "moderate",
          "tolerant",
          "no_preference",
        ),
        allowNull: true,
      },
      preferred_smoking_preference: {
        type: DataTypes.ENUM("yes", "no", "no_preference"),
        allowNull: true,
      },
      preferred_drinking_preference: {
        type: DataTypes.ENUM("yes", "no", "no_preference"),
        allowNull: true,
      },
      preferred_social_behavior: {
        type: DataTypes.ENUM(
          "social",
          "moderate",
          "introverted",
          "no_preference",
        ),
        allowNull: true,
      },
      preferred_study_preferences: {
        type: DataTypes.ENUM("studious", "moderate", "casual", "no_preference"),
        allowNull: true,
      },
    },
    {
      tableName: "match_preferences",
    },
  );
  return MatchPreference;
};
