const { Sequelize } = require("sequelize");
const { config } = require("../config");
const { logger } = require("../utils/logger");

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: "mysql",
    logging:
      config.db.queryLogging === true
        ? (sql) => logger.debug({ db: true }, sql)
        : false,
    define: {
      underscored: true,
      timestamps: true,
    },
  },
);

const User = require("./User")(sequelize);
const Profile = require("./Profile")(sequelize);
const MatchPreference = require("./MatchPreference")(sequelize);
const Chat = require("./Chat")(sequelize);
const Message = require("./Message")(sequelize);
const Session = require("./Session")(sequelize);
const Group = require("./Group")(sequelize);
const GroupMember = require("./GroupMember")(sequelize);
const GroupInvitation = require("./GroupInvitation")(sequelize);
const GroupHousingPreference = require("./GroupHousingPreference")(sequelize);
const HousingUnit = require("./HousingUnit")(sequelize);
const GroupAssignment = require("./GroupAssignment")(sequelize);

User.hasOne(Profile, {
  foreignKey: "user_id",
  as: "profile",
  onDelete: "CASCADE",
});
Profile.belongsTo(User, { foreignKey: "user_id" });

User.hasOne(MatchPreference, {
  foreignKey: "user_id",
  as: "matchPreference",
  onDelete: "CASCADE",
});
MatchPreference.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Session, {
  foreignKey: "user_id",
  as: "sessions",
  onDelete: "CASCADE",
});
Session.belongsTo(User, { foreignKey: "user_id" });

Chat.hasMany(Message, { foreignKey: "chat_id", as: "messages" });
Message.belongsTo(Chat, { foreignKey: "chat_id" });
Message.belongsTo(User, { foreignKey: "sender_user_id", as: "sender" });

User.hasMany(Group, {
  foreignKey: "owner_user_id",
  as: "ownedGroups",
  onDelete: "CASCADE",
});
Group.belongsTo(User, {
  foreignKey: "owner_user_id",
  as: "owner",
});
Group.belongsTo(Chat, {
  foreignKey: "chat_id",
  as: "groupChat",
});

Group.hasMany(GroupMember, {
  foreignKey: "group_id",
  as: "members",
  onDelete: "CASCADE",
});
GroupMember.belongsTo(Group, { foreignKey: "group_id" });
GroupMember.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(GroupMember, {
  foreignKey: "user_id",
  as: "groupMemberships",
  onDelete: "CASCADE",
});

Group.hasMany(GroupInvitation, {
  foreignKey: "group_id",
  as: "invitations",
  onDelete: "CASCADE",
});
GroupInvitation.belongsTo(Group, { foreignKey: "group_id" });
GroupInvitation.belongsTo(User, {
  foreignKey: "inviter_user_id",
  as: "inviter",
});
GroupInvitation.belongsTo(User, {
  foreignKey: "invitee_user_id",
  as: "invitee",
});
User.hasMany(GroupInvitation, {
  foreignKey: "inviter_user_id",
  as: "sentGroupInvitations",
  onDelete: "CASCADE",
});
User.hasMany(GroupInvitation, {
  foreignKey: "invitee_user_id",
  as: "receivedGroupInvitations",
  onDelete: "CASCADE",
});

Group.hasOne(GroupHousingPreference, {
  foreignKey: "group_id",
  as: "housingPreference",
  onDelete: "CASCADE",
});
GroupHousingPreference.belongsTo(Group, {
  foreignKey: "group_id",
});

Group.hasMany(GroupAssignment, {
  foreignKey: "group_id",
  as: "assignments",
  onDelete: "CASCADE",
});
GroupAssignment.belongsTo(Group, {
  foreignKey: "group_id",
});
HousingUnit.hasMany(GroupAssignment, {
  foreignKey: "housing_unit_id",
  as: "assignments",
  onDelete: "CASCADE",
});
GroupAssignment.belongsTo(HousingUnit, {
  foreignKey: "housing_unit_id",
  as: "housingUnit",
});

async function initDatabase() {
  await sequelize.authenticate();
  logger.info("MySQL connection established.");
  if (config.db.sync) {
    await sequelize.sync({ alter: config.db.syncAlter });
    // await sequelize.sync({ force: true }); // For development, force sync to reset DB on each run. In production, use alter to apply non-destructive changes.
    logger.info(
      { alter: config.db.syncAlter },
      "Database schema synchronized (sequelize.sync).",
    );
  }
}

module.exports = {
  sequelize,
  initDatabase,
  User,
  Profile,
  MatchPreference,
  Chat,
  Message,
  Session,
  Group,
  GroupMember,
  GroupInvitation,
  GroupHousingPreference,
  HousingUnit,
  GroupAssignment,
};
