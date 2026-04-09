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
        allowNull: true,
      },
      sleep_schedule: {
        type: DataTypes.ENUM("early_bird", "night_owl"),
        allowNull: true,
      },
      cleanliness_level: {
        type: DataTypes.ENUM("clean", "average", "relaxed"),
        allowNull: true,
      },
      noise_tolerance: {
        type: DataTypes.ENUM("sensitive", "moderate", "tolerant"),
        allowNull: true,
      },
      smoking_preference: {
        type: DataTypes.ENUM("yes", "no"),
        allowNull: true,
      },
      drinking_preference: {
        type: DataTypes.ENUM("yes", "no"),
        allowNull: true,
      },
      social_behavior: {
        type: DataTypes.ENUM("social", "moderate", "introverted"),
        allowNull: true,
      },
      study_preferences: {
        type: DataTypes.ENUM("studious", "moderate", "casual"),
        allowNull: true,
      },
    },
    {
      tableName: "profiles",
    },
  );

  return Profile;
};
