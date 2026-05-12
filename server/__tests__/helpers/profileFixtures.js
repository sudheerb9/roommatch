/** Builds a PUT /profile/me body that touches preference fields only (all enum fields required). */
function validPreferencePayload() {
  return {
    preferred_sleep_schedule: "early_bird",
    preferred_cleanliness_level: "clean",
    preferred_noise_tolerance: "sensitive",
    preferred_smoking_preference: "no",
    preferred_drinking_preference: "no",
    preferred_social_behavior: "moderate",
    preferred_study_preferences: "studious",
  };
}

/** Full profile core + bio (preferences omitted). */
function validProfileCorePayload() {
  return {
    bio: "Hi",
    gender: "cis_male",
    sleep_schedule: "early_bird",
    cleanliness_level: "clean",
    noise_tolerance: "sensitive",
    smoking_preference: "no",
    drinking_preference: "no",
    social_behavior: "social",
    study_preferences: "studious",
  };
}

module.exports = {
  validPreferencePayload,
  validProfileCorePayload,
};
