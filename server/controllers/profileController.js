const { Profile, MatchPreference } = require("../models");

const PROFILE_ENUMS = {
  gender: new Set([
    "cis_male",
    "cis_female",
    "trans_male",
    "trans_female",
    "non_binary",
    "prefer_not_to_say",
  ]),
  sleep_schedule: new Set(["early_bird", "night_owl"]),
  cleanliness_level: new Set(["clean", "average", "relaxed"]),
  noise_tolerance: new Set(["sensitive", "moderate", "tolerant"]),
  smoking_preference: new Set(["yes", "no"]),
  drinking_preference: new Set(["yes", "no"]),
  social_behavior: new Set(["social", "moderate", "introverted"]),
  study_preferences: new Set(["studious", "moderate", "casual"]),
};

const PREFERENCE_ENUMS = {
  preferred_sleep_schedule: new Set(["early_bird", "night_owl", "no_preference"]),
  preferred_cleanliness_level: new Set([
    "clean",
    "average",
    "relaxed",
    "no_preference",
  ]),
  preferred_noise_tolerance: new Set([
    "sensitive",
    "moderate",
    "tolerant",
    "no_preference",
  ]),
  preferred_smoking_preference: new Set(["yes", "no", "no_preference"]),
  preferred_drinking_preference: new Set(["yes", "no", "no_preference"]),
  preferred_social_behavior: new Set([
    "social",
    "moderate",
    "introverted",
    "no_preference",
  ]),
  preferred_study_preferences: new Set([
    "studious",
    "moderate",
    "casual",
    "no_preference",
  ]),
};

const PROFILE_FIELDS = ["bio", ...Object.keys(PROFILE_ENUMS)];
const PREFERENCE_FIELDS = Object.keys(PREFERENCE_ENUMS);
const ALL_FIELDS = new Set([...PROFILE_FIELDS, ...PREFERENCE_FIELDS]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateEnumOrNull(name, value, allowedSet) {
  if (value === null) {
    return { ok: true, normalized: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: `${name} must be a string or null` };
  }
  const trimmed = value.trim();
  if (!allowedSet.has(trimmed)) {
    return {
      ok: false,
      error: `${name} must be one of: ${Array.from(allowedSet).join(", ")}`,
    };
  }
  return { ok: true, normalized: trimmed };
}

function validateBio(value) {
  if (value === null) {
    return { ok: true, normalized: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "bio must be a string or null" };
  }
  const trimmed = value.trim();
  if (trimmed.length > 2000) {
    return { ok: false, error: "bio must be at most 2000 characters" };
  }
  return { ok: true, normalized: trimmed.length === 0 ? null : trimmed };
}

function validateAndNormalizePatch(body) {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const keys = Object.keys(body);
  for (const key of keys) {
    if (!ALL_FIELDS.has(key)) {
      return { ok: false, error: `Unknown field: ${key}` };
    }
  }

  const profilePatch = {};
  const preferencePatch = {};

  if (Object.prototype.hasOwnProperty.call(body, "bio")) {
    const out = validateBio(body.bio);
    if (!out.ok) return out;
    profilePatch.bio = out.normalized;
  }

  for (const [field, allowedSet] of Object.entries(PROFILE_ENUMS)) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      const out = validateEnumOrNull(field, body[field], allowedSet);
      if (!out.ok) return out;
      profilePatch[field] = out.normalized;
    }
  }

  for (const [field, allowedSet] of Object.entries(PREFERENCE_ENUMS)) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      const out = validateEnumOrNull(field, body[field], allowedSet);
      if (!out.ok) return out;
      preferencePatch[field] = out.normalized;
    }
  }

  return { ok: true, profilePatch, preferencePatch };
}

function asProfileResponse(user, profile, preference) {
  return {
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
    },
    profile: profile
      ? {
          user_id: profile.user_id,
          bio: profile.bio,
          gender: profile.gender,
          sleep_schedule: profile.sleep_schedule,
          cleanliness_level: profile.cleanliness_level,
          noise_tolerance: profile.noise_tolerance,
          smoking_preference: profile.smoking_preference,
          drinking_preference: profile.drinking_preference,
          social_behavior: profile.social_behavior,
          study_preferences: profile.study_preferences,
        }
      : null,
    preferences: preference
      ? {
          user_id: preference.user_id,
          preferred_sleep_schedule: preference.preferred_sleep_schedule,
          preferred_cleanliness_level: preference.preferred_cleanliness_level,
          preferred_noise_tolerance: preference.preferred_noise_tolerance,
          preferred_smoking_preference: preference.preferred_smoking_preference,
          preferred_drinking_preference: preference.preferred_drinking_preference,
          preferred_social_behavior: preference.preferred_social_behavior,
          preferred_study_preferences: preference.preferred_study_preferences,
        }
      : null,
  };
}

async function getMyProfile(req, res, next) {
  try {
    const user = req.user;

    const [profile, preference] = await Promise.all([
      Profile.findByPk(user.id),
      MatchPreference.findByPk(user.id),
    ]);

    return res.status(200).json(asProfileResponse(user, profile, preference));
  } catch (err) {
    return next(err);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const user = req.user;
    const validation = validateAndNormalizePatch(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const { profilePatch, preferencePatch } = validation;

    let profile = await Profile.findByPk(user.id);
    if (!profile) {
      profile = await Profile.create({ user_id: user.id });
    }

    let preference = await MatchPreference.findByPk(user.id);
    if (!preference) {
      preference = await MatchPreference.create({ user_id: user.id });
    }

    if (Object.keys(profilePatch).length > 0) {
      await profile.update(profilePatch);
    }
    if (Object.keys(preferencePatch).length > 0) {
      await preference.update(preferencePatch);
    }

    return res.status(200).json(asProfileResponse(user, profile, preference));
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
};

