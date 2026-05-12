// Defines the GroupHousingPreference Sequelize model schema and relationships.
const { DataTypes } = require("sequelize");

/** @param {import("sequelize").Sequelize} sequelize */
module.exports = (sequelize) => {
  const GroupHousingPreference = sequelize.define(
    "GroupHousingPreference",
    {
      group_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: { model: "groups", key: "id" },
      },
      preferred_bedrooms: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
      },
      preferred_bathrooms: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true,
      },
      preferred_floor: {
        type: DataTypes.ENUM("any", "low", "middle", "high"),
        allowNull: true,
      },
      amenities: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "group_housing_preferences",
    },
  );

  return GroupHousingPreference;
};
