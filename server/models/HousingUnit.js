const { DataTypes } = require("sequelize");

/** @param {import("sequelize").Sequelize} sequelize */
module.exports = (sequelize) => {
  const HousingUnit = sequelize.define(
    "HousingUnit",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      unit_code: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true,
      },
      building: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      bedrooms: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
      },
      bathrooms: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: false,
      },
      floor: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      amenities: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      is_available: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "housing_units",
      indexes: [
        {
          name: "housing_units_available_idx",
          fields: ["is_available"],
        },
      ],
    },
  );

  return HousingUnit;
};
