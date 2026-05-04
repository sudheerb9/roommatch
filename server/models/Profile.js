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
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM(
          "cis_male",
          "cis_female",
          "trans_male",
          "trans_female",
          "non_binary",
          "prefer_not_to_say",
        ),
        allowNull: false,
      },
      sleep_schedule: {
        type: DataTypes.ENUM("early_bird", "night_owl"),
        allowNull: false,
      },
      cleanliness_level: {
        type: DataTypes.ENUM("clean", "average", "relaxed"),
        allowNull: false,
      },
      noise_tolerance: {
        type: DataTypes.ENUM("sensitive", "moderate", "tolerant"),
        allowNull: false,
      },
      smoking_preference: {
        type: DataTypes.ENUM("yes", "no"),
        allowNull: false,
      },
      drinking_preference: {
        type: DataTypes.ENUM("yes", "no"),
        allowNull: false,
      },
      social_behavior: {
        type: DataTypes.ENUM("social", "moderate", "introverted"),
        allowNull: false,
      },
      study_preferences: {
        type: DataTypes.ENUM("studious", "moderate", "casual"),
        allowNull: false,
      },
    },
    {
      tableName: "profiles",
    },
  );

  const { scheduleMatchScoreRebuild } = require("../jobs/scheduleMatchScoreRebuild");

  Profile.addHook("afterSave", (instance) => {
    scheduleMatchScoreRebuild(instance.user_id);
  });

  Profile.addHook("afterDestroy", (instance) => {
    scheduleMatchScoreRebuild(instance.user_id);
  });

  return Profile;
};
