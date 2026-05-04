const { Op } = require("sequelize");
const { User, Profile, MatchPreference } = require("../models");
const { config } = require("../config");
const { userAccountIsActive } = require("../utils/userAccount");
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

/**
 * User appears in matching only with a completed profile row and an active account.
 * (Profile row implies required lifestyle fields are set.)
 */
async function isMatchingEligible(userId) {
  const user = await User.findByPk(userId, { attributes: ["id", "is_active"] });
  if (!user || !userAccountIsActive(user)) {
    return false;
  }
  const profile = await Profile.findOne({
    where: { user_id: userId },
    attributes: ["user_id"],
  });
  return Boolean(profile);
}

async function filterMatchingEligibleUserIds(userIds) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) {
    return new Set();
  }
  const activeUsers = await User.findAll({
    where: { id: { [Op.in]: unique }, is_active: true },
    attributes: ["id"],
  });
  const activeIds = activeUsers.map((u) => u.id);
  if (activeIds.length === 0) {
    return new Set();
  }
  const profiles = await Profile.findAll({
    where: { user_id: { [Op.in]: activeIds } },
    attributes: ["user_id"],
  });
  return new Set(profiles.map((p) => Number(p.user_id)));
}

function normEnum(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    const t = value.trim();
    return t.length === 0 ? null : t;
  }
  return String(value);
}

/**
 * Compatibility from the viewer's MatchPreference row vs the candidate's Profile row
 * (not preference-vs-preference). Each comparable attribute contributes 0 or 100;
 * no_preference (or missing preference) counts as 100. If the viewer has a strict
 * preference but the candidate's profile field is empty, that attribute is skipped
 * (not treated as a mismatch).
 */
function computeMatchScore(viewerPreference, candidateProfile) {
  const parts = [];
  for (const [prefField, profileField] of ATTRIBUTE_PAIRS) {
    const prefValue = viewerPreference
      ? normEnum(viewerPreference[prefField])
      : null;
    const profileValue = candidateProfile
      ? normEnum(candidateProfile[profileField])
      : null;

    if (!prefValue || prefValue === "no_preference") {
      parts.push(100);
      continue;
    }
    if (profileValue == null) {
      continue;
    }
    parts.push(prefValue === profileValue ? 100 : 0);
  }

  if (parts.length === 0) {
    return 0;
  }
  const sum = parts.reduce((acc, value) => acc + value, 0);
  return Math.round(sum / parts.length);
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
  const eligibleIds = await filterMatchingEligibleUserIds(userIds);
  const users = await User.findAll({
    where: { id: { [Op.in]: userIds }, is_active: true },
    attributes: ["id", "display_name", "email"],
  });
  const usersById = new Map(users.map((user) => [user.id, user]));

  return items
    .map((item) => {
      if (!eligibleIds.has(item.userId)) {
        return null;
      }
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

  const key = getZsetKey(viewerUserId);
  if (!(await isMatchingEligible(viewerUserId))) {
    await redis.del(key);
    return { viewerUserId, candidatesStored: 0, skipped: true };
  }

  const viewerPreference = await MatchPreference.findByPk(viewerUserId);
  const candidateProfiles = await Profile.findAll({
    where: { user_id: { [Op.ne]: viewerUserId } },
    attributes: ["user_id", ...ATTRIBUTE_PAIRS.map(([, profileField]) => profileField)],
  });

  const candidateIds = candidateProfiles.map((p) => Number(p.user_id));
  const eligibleCandidateIds = await filterMatchingEligibleUserIds(candidateIds);

  await redis.del(key);

  const scored = [];
  for (const candidateProfile of candidateProfiles) {
    const cid = Number(candidateProfile.user_id);
    if (!eligibleCandidateIds.has(cid)) {
      continue;
    }
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

  const allViewerRows = await MatchPreference.findAll({
    attributes: ["user_id", ...ATTRIBUTE_PAIRS.map(([prefField]) => prefField)],
  });

  if (!(await isMatchingEligible(targetUserId))) {
    await redis.del(getZsetKey(targetUserId));
    let cleared = 0;
    for (const row of allViewerRows) {
      await redis.zRem(getZsetKey(row.user_id), String(targetUserId));
      cleared += 1;
    }
    return { targetUserId, viewersUpdated: cleared, cleared: true };
  }

  const targetProfile = await Profile.findByPk(targetUserId, {
    attributes: ["user_id", ...ATTRIBUTE_PAIRS.map(([, profileField]) => profileField)],
  });
  if (!targetProfile) {
    return { targetUserId, viewersUpdated: 0 };
  }

  const viewerIds = allViewerRows.map((r) => Number(r.user_id));
  const eligibleViewers = await filterMatchingEligibleUserIds(viewerIds);

  let viewersUpdated = 0;
  for (const viewerPreference of allViewerRows) {
    const viewerId = viewerPreference.user_id;
    if (Number(viewerId) === Number(targetUserId)) {
      continue;
    }
    const key = getZsetKey(viewerId);
    if (!eligibleViewers.has(Number(viewerId))) {
      await redis.zRem(key, String(targetUserId));
      viewersUpdated += 1;
      continue;
    }
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
  isMatchingEligible,
  getMatchedUserIdsAndScores,
  getMatchedUsersForUser,
  rebuildScoresForUserWithEveryone,
  rebuildScoresOfEveryoneWithUser,
};
