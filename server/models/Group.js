const { DataTypes } = require("sequelize");

/** @param {import("sequelize").Sequelize} sequelize */
module.exports = (sequelize) => {
  const Group = sequelize.define(
    "Group",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      owner_user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("forming", "ready", "assigned", "archived"),
        allowNull: false,
        defaultValue: "forming",
      },
      chat_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "chats", key: "id" },
      },
    },
    {
      tableName: "groups",
      indexes: [
        {
          name: "groups_owner_user_id_idx",
          fields: ["owner_user_id"],
        },
        {
          name: "groups_status_idx",
          fields: ["status"],
        },
      ],
    },
  );

  return Group;
};
