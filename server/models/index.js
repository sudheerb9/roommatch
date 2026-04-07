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
const ChatParticipant = require("./ChatParticipant")(sequelize);
const Message = require("./Message")(sequelize);

User.hasOne(Profile, { foreignKey: "user_id", as: "profile", onDelete: "CASCADE" });
Profile.belongsTo(User, { foreignKey: "user_id" });

User.hasOne(MatchPreference, {
  foreignKey: "user_id",
  as: "matchPreference",
  onDelete: "CASCADE",
});
MatchPreference.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(ChatParticipant, { foreignKey: "user_id" });
Chat.hasMany(ChatParticipant, { foreignKey: "chat_id" });
ChatParticipant.belongsTo(User, { foreignKey: "user_id" });
ChatParticipant.belongsTo(Chat, { foreignKey: "chat_id" });

User.belongsToMany(Chat, {
  through: ChatParticipant,
  foreignKey: "user_id",
  otherKey: "chat_id",
});
Chat.belongsToMany(User, {
  through: ChatParticipant,
  foreignKey: "chat_id",
  otherKey: "user_id",
});

Chat.hasMany(Message, { foreignKey: "chat_id", as: "messages" });
Message.belongsTo(Chat, { foreignKey: "chat_id" });
Message.belongsTo(User, { foreignKey: "sender_user_id", as: "sender" });

async function initDatabase() {
  await sequelize.authenticate();
  logger.info("MySQL connection established.");
  if (config.db.sync) {
    await sequelize.sync({ alter: config.db.syncAlter });
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
  ChatParticipant,
  Message,
};
