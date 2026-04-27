const { DataTypes } = require("sequelize");

/** @param {import("sequelize").Sequelize} sequelize */
module.exports = (sequelize) => {
  const GroupInvitation = sequelize.define(
    "GroupInvitation",
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
      inviter_user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      invitee_user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "accepted",
          "rejected",
          "expired",
          "cancelled",
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      responded_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      note: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      tableName: "group_invitations",
      indexes: [
        {
          name: "group_invitations_group_invitee_status_idx",
          fields: ["group_id", "invitee_user_id", "status"],
        },
        {
          name: "group_invitations_group_status_idx",
          fields: ["group_id", "status"],
        },
      ],
    },
  );

  return GroupInvitation;
};
