// Defines the GroupMember Sequelize model schema and relationships.
const { DataTypes } = require("sequelize");

/** @param {import("sequelize").Sequelize} sequelize */
module.exports = (sequelize) => {
  const GroupMember = sequelize.define(
    "GroupMember",
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
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      role: {
        type: DataTypes.ENUM("owner", "member"),
        allowNull: false,
        defaultValue: "member",
      },
      joined_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "group_members",
      updatedAt: false,
      indexes: [
        {
          name: "group_members_group_user_unique",
          unique: true,
          fields: ["group_id", "user_id"],
        },
        {
          name: "group_members_user_id_idx",
          fields: ["user_id"],
        },
      ],
    },
  );

  return GroupMember;
};
