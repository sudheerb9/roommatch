const { DataTypes } = require("sequelize");

/** @param {import("sequelize").Sequelize} sequelize */
module.exports = (sequelize) => {
  const GroupAssignment = sequelize.define(
    "GroupAssignment",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      group_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "groups", key: "id" },
      },
      housing_unit_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "housing_units", key: "id" },
      },
      status: {
        type: DataTypes.ENUM("proposed", "assigned", "released"),
        allowNull: false,
        defaultValue: "assigned",
      },
      assigned_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      note: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      tableName: "group_assignments",
      updatedAt: false,
      indexes: [
        {
          name: "group_assignments_group_status_idx",
          fields: ["group_id", "status"],
        },
        {
          name: "group_assignments_housing_unit_status_idx",
          fields: ["housing_unit_id", "status"],
        },
      ],
    },
  );

  return GroupAssignment;
};
