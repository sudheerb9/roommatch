const { Profile, MatchPreference, User } = require("../models");
const { userAccountIsActive } = require("../utils/userAccount");

// Profile enums describe the user's own lifestyle.
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

const REQUIRED_PROFILE_KEYS = Object.keys(PROFILE_ENUMS);
const PREFERENCE_FIELDS = Object.keys(PREFERENCE_ENUMS);
const ALL_FIELDS = new Set(["bio", ...REQUIRED_PROFILE_KEYS, ...PREFERENCE_FIELDS]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateRequiredEnum(name, value, allowedSet) {
  if (value === null || value === undefined) {
    return { ok: false, error: `${name} is required` };
  }
  if (typeof value !== "string") {
    return { ok: false, error: `${name} must be a string` };
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
  if (keys.length === 0) {
    return { ok: false, error: "Empty body" };
  }

  for (const key of keys) {
    if (!ALL_FIELDS.has(key)) {
      return { ok: false, error: `Unknown field: ${key}` };
    }
  }

  const touchesPreference = PREFERENCE_FIELDS.some((k) =>
    Object.prototype.hasOwnProperty.call(body, k),
  );
  const touchesProfileCore = REQUIRED_PROFILE_KEYS.some((k) =>
    Object.prototype.hasOwnProperty.call(body, k),
  );
  const touchesBio = Object.prototype.hasOwnProperty.call(body, "bio");

  if (!touchesPreference && !touchesProfileCore && !touchesBio) {
    return { ok: false, error: "No valid fields in body" };
  }

  const profilePatch = {};
  const preferencePatch = {};

  if (touchesPreference) {
    // Preference updates are all-or-nothing to avoid partial stale preference sets.
    for (const field of PREFERENCE_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(body, field)) {
        return {
          ok: false,
          error: `Missing required preference field: ${field}`,
        };
      }
      const out = validateRequiredEnum(field, body[field], PREFERENCE_ENUMS[field]);
      if (!out.ok) {
        return out;
      }
      preferencePatch[field] = out.normalized;
    }
  }

  if (touchesProfileCore) {
    // Same rule for core lifestyle fields: require a complete set when touched.
    for (const field of REQUIRED_PROFILE_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(body, field)) {
        return { ok: false, error: `Missing required profile field: ${field}` };
      }
      const out = validateRequiredEnum(field, body[field], PROFILE_ENUMS[field]);
      if (!out.ok) {
        return out;
      }
      profilePatch[field] = out.normalized;
    }
  }

  if (touchesBio) {
    const out = validateBio(body.bio);
    if (!out.ok) {
      return out;
    }
    profilePatch.bio = out.normalized;
  }

  return { ok: true, profilePatch, preferencePatch };
}

function asProfileResponse(user, profile, preference) {
  const matchingEligible = Boolean(profile) && userAccountIsActive(user);
  return {
    matching_eligible: matchingEligible,
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
      Profile.findOne({ where: { user_id: user.id } }),
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

    let profile = await Profile.findOne({ where: { user_id: user.id } });
    let preference = await MatchPreference.findByPk(user.id);

    const profileEnumKeys = REQUIRED_PROFILE_KEYS.filter((k) =>
      Object.prototype.hasOwnProperty.call(profilePatch, k),
    );
    const hasBio = Object.prototype.hasOwnProperty.call(profilePatch, "bio");
    const isBioOnly = hasBio && profileEnumKeys.length === 0;

    if (Object.keys(preferencePatch).length > 0) {
      if (!preference) {
        preference = await MatchPreference.create({
          user_id: user.id,
          ...preferencePatch,
        });
      } else {
        await preference.update(preferencePatch);
      }
    }

    if (profileEnumKeys.length > 0) {
      const slice = {};
      for (const k of profileEnumKeys) {
        slice[k] = profilePatch[k];
      }
      if (hasBio) {
        slice.bio = profilePatch.bio;
      }
      if (!profile) {
        profile = await Profile.create({ user_id: user.id, ...slice });
      } else {
        await profile.update(slice);
      }
      // Ensure preference row exists once a full profile is present.
      if (!(await MatchPreference.findByPk(user.id))) {
        await MatchPreference.create({ user_id: user.id });
      }
    } else if (isBioOnly) {
      if (!profile) {
        return res.status(400).json({
          error:
            "Complete your profile (lifestyle fields) before updating bio only.",
        });
      }
      await profile.update({ bio: profilePatch.bio });
    }

    profile = await Profile.findOne({ where: { user_id: user.id } });
    preference = await MatchPreference.findByPk(user.id);

    return res.status(200).json(asProfileResponse(user, profile, preference));
  } catch (err) {
    return next(err);
  }
}

async function getUserProfile(req, res, next) {
  try {
    const rawUserId = req.params.userId;
    const userId = Number(rawUserId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const user = await User.findByPk(userId, {
      attributes: ["id", "email", "display_name", "is_active"],
    });
    if (!user || !userAccountIsActive(user)) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profile = await Profile.findOne({ where: { user_id: userId } });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
      },
      profile: {
        bio: profile.bio,
        gender: profile.gender,
        sleep_schedule: profile.sleep_schedule,
        cleanliness_level: profile.cleanliness_level,
        noise_tolerance: profile.noise_tolerance,
        smoking_preference: profile.smoking_preference,
        drinking_preference: profile.drinking_preference,
        social_behavior: profile.social_behavior,
        study_preferences: profile.study_preferences,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
};
