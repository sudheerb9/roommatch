const { DataTypes } = require("sequelize");

/**
 * Roommate preferences (desired traits in others). Defaults to no_preference per field.
 *
 * @param {import("sequelize").Sequelize} sequelize
 */
module.exports = (sequelize) => {
  const noPref = "no_preference";
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
        allowNull: false,
        defaultValue: noPref,
      },
      preferred_cleanliness_level: {
        type: DataTypes.ENUM(
          "clean",
          "average",
          "relaxed",
          "no_preference",
        ),
        allowNull: false,
        defaultValue: noPref,
      },
      preferred_noise_tolerance: {
        type: DataTypes.ENUM(
          "sensitive",
          "moderate",
          "tolerant",
          "no_preference",
        ),
        allowNull: false,
        defaultValue: noPref,
      },
      preferred_smoking_preference: {
        type: DataTypes.ENUM("yes", "no", "no_preference"),
        allowNull: false,
        defaultValue: noPref,
      },
      preferred_drinking_preference: {
        type: DataTypes.ENUM("yes", "no", "no_preference"),
        allowNull: false,
        defaultValue: noPref,
      },
      preferred_social_behavior: {
        type: DataTypes.ENUM(
          "social",
          "moderate",
          "introverted",
          "no_preference",
        ),
        allowNull: false,
        defaultValue: noPref,
      },
      preferred_study_preferences: {
        type: DataTypes.ENUM("studious", "moderate", "casual", "no_preference"),
        allowNull: false,
        defaultValue: noPref,
      },
    },
    {
      tableName: "match_preferences",
    },
  );

  const { scheduleMatchScoreRebuild } = require("../jobs/scheduleMatchScoreRebuild");

  MatchPreference.addHook("afterSave", (instance) => {
    scheduleMatchScoreRebuild(instance.user_id);
  });

  MatchPreference.addHook("afterDestroy", (instance) => {
    scheduleMatchScoreRebuild(instance.user_id);
  });

  return MatchPreference;
};
