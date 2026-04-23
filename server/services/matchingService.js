const { Op } = require("sequelize");
const { User, Profile, MatchPreference } = require("../models");
const { config } = require("../config");
const { ensureRedisConnected } = require("../utils/redisClient");

const ATTRIBUTE_PAIRS = [
  ["preferred_sleep_schedule", "sleep_schedule"],
  ["preferred_cleanliness_level", "cleanliness_level"],
  ["preferred_noise_tolerance", "noise_tolerance"],
  ["preferred_smoking_preference", "smoking_preference"],
  ["preferred_drinking_preference", "drinking_preference"],
  ["preferred_social_behavior", "social_behavior"],
  ["preferred_study_preferences", "study_preferences"],
];

function getZsetKey(userId) {
  return `match_scores:${userId}`;
}

function computeMatchScore(viewerPreference, candidateProfile) {
  const perAttributeScore = ATTRIBUTE_PAIRS.map(([prefField, profileField]) => {
    const prefValue = viewerPreference ? viewerPreference[prefField] : null;
    const profileValue = candidateProfile ? candidateProfile[profileField] : null;
    if (!prefValue || prefValue === "no_preference") {
      return 100;
    }
    return prefValue === profileValue ? 100 : 0;
  });

  const sum = perAttributeScore.reduce((acc, value) => acc + value, 0);
  return Math.round(sum / ATTRIBUTE_PAIRS.length);
}

async function getMatchedUserIdsAndScores(viewerUserId, { limit, offset }) {
  const redis = await ensureRedisConnected();
  const key = getZsetKey(viewerUserId);
  const entries = await redis.zRangeWithScores(
    key,
    offset,
    offset + limit - 1,
    {
      REV: true,
    },
  );

  return entries.map((entry) => ({
    userId: parseInt(entry.value, 10),
    score: entry.score,
  }));
}

async function getMatchedUsersForUser(viewerUserId, { limit, offset }) {
  const items = await getMatchedUserIdsAndScores(viewerUserId, { limit, offset });
  if (items.length === 0) {
    return [];
  }

  const userIds = items.map((item) => item.userId);
  const users = await User.findAll({
    where: { id: { [Op.in]: userIds } },
    attributes: ["id", "display_name", "email"],
  });
  const usersById = new Map(users.map((user) => [user.id, user]));

  return items
    .map((item) => {
      const user = usersById.get(item.userId);
      if (!user) {
        return null;
      }
      return {
        user_id: user.id,
        display_name: user.display_name,
        email: user.email,
        score: item.score,
      };
    })
    .filter(Boolean);
}

async function rebuildScoresForUserWithEveryone(viewerUserId) {
  const redis = await ensureRedisConnected();
  const threshold = config.matching.threshold;

  const viewerPreference = await MatchPreference.findByPk(viewerUserId);
  const candidateProfiles = await Profile.findAll({
    where: { user_id: { [Op.ne]: viewerUserId } },
    attributes: ["user_id", ...ATTRIBUTE_PAIRS.map(([, profileField]) => profileField)],
  });

  const key = getZsetKey(viewerUserId);
  await redis.del(key);

  const scored = [];
  for (const candidateProfile of candidateProfiles) {
    const score = computeMatchScore(viewerPreference, candidateProfile);
    if (score >= threshold) {
      scored.push({ score, value: String(candidateProfile.user_id) });
    }
  }

  if (scored.length > 0) {
    await redis.zAdd(key, scored);
  }

  return { viewerUserId, candidatesStored: scored.length };
}

async function rebuildScoresOfEveryoneWithUser(targetUserId) {
  const redis = await ensureRedisConnected();
  const threshold = config.matching.threshold;

  const targetProfile = await Profile.findByPk(targetUserId, {
    attributes: ["user_id", ...ATTRIBUTE_PAIRS.map(([, profileField]) => profileField)],
  });
  if (!targetProfile) {
    return { targetUserId, viewersUpdated: 0 };
  }

  const allViewers = await MatchPreference.findAll({
    where: { user_id: { [Op.ne]: targetUserId } },
    attributes: ["user_id", ...ATTRIBUTE_PAIRS.map(([prefField]) => prefField)],
  });

  let viewersUpdated = 0;
  for (const viewerPreference of allViewers) {
    const viewerId = viewerPreference.user_id;
    const key = getZsetKey(viewerId);
    const score = computeMatchScore(viewerPreference, targetProfile);
    if (score >= threshold) {
      await redis.zAdd(key, [{ score, value: String(targetUserId) }]);
    } else {
      await redis.zRem(key, String(targetUserId));
    }
    viewersUpdated += 1;
  }

  return { targetUserId, viewersUpdated };
}

module.exports = {
  computeMatchScore,
  getMatchedUserIdsAndScores,
  getMatchedUsersForUser,
  rebuildScoresForUserWithEveryone,
  rebuildScoresOfEveryoneWithUser,
};
