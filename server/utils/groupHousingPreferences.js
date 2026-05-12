// Shared helper utilities for groupHousingPreferences operations.
const FLOOR_ENUM = new Set(["any", "low", "middle", "high"]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Validates JSON body for group housing preference updates (partial PUT).
 * Preferred bedrooms capped at 10 to align with client UI.
 * @param {unknown} body
 * @returns {{ ok: true, patch: Record<string, unknown> } | { ok: false, error: string }}
 */
function validateHousingPreferencesPatch(body) {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const allowed = new Set([
    "preferred_bedrooms",
    "preferred_bathrooms",
    "preferred_floor",
    "amenities",
  ]);

  const keys = Object.keys(body);
  for (let i = 0; i < keys.length; i += 1) {
    if (!allowed.has(keys[i])) {
      return { ok: false, error: `Unknown field: ${keys[i]}` };
    }
  }

  if (keys.length === 0) {
    return { ok: true, patch: {} };
  }

  /** @type {Record<string, unknown>} */
  const patch = {};

  if (Object.prototype.hasOwnProperty.call(body, "preferred_bedrooms")) {
    const v = body.preferred_bedrooms;
    if (v === null) {
      patch.preferred_bedrooms = null;
    } else if (typeof v !== "number" || !Number.isInteger(v)) {
      return {
        ok: false,
        error:
          "preferred_bedrooms must be an integer between 1 and 10 or null",
      };
    } else if (v < 1 || v > 10) {
      return {
        ok: false,
        error: "preferred_bedrooms must be between 1 and 10 (or null)",
      };
    } else {
      patch.preferred_bedrooms = v;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "preferred_bathrooms")) {
    const v = body.preferred_bathrooms;
    if (v === null) {
      patch.preferred_bathrooms = null;
    } else {
      const raw =
        typeof v === "string" ? Number.parseFloat(v) : typeof v === "number" ? v : NaN;
      if (
        typeof raw !== "number" ||
        Number.isNaN(raw) ||
        raw < 0 ||
        raw > 99.9
      ) {
        return {
          ok: false,
          error:
            "preferred_bathrooms must be a non-negative decimal (max 99.9) or null",
        };
      }
      // Normalize to one decimal place to match DB precision and response shape.
      patch.preferred_bathrooms = Math.round(raw * 10) / 10;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "preferred_floor")) {
    const v = body.preferred_floor;
    if (v === null) {
      patch.preferred_floor = null;
    } else if (typeof v !== "string") {
      return {
        ok: false,
        error:
          'preferred_floor must be one of: any, low, middle, high, or null',
      };
    } else {
      // Trim client input so " low " still maps to the same enum value.
      const t = v.trim();
      if (!FLOOR_ENUM.has(t)) {
        return {
          ok: false,
          error:
            'preferred_floor must be one of: any, low, middle, high, or null',
        };
      }
      patch.preferred_floor = t;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "amenities")) {
    const v = body.amenities;
    if (v === null) {
      patch.amenities = null;
    } else if (!isPlainObject(v)) {
      return {
        ok: false,
        error:
          "amenities must be a JSON object, or null (empty object is allowed)",
      };
    } else {
      patch.amenities = v;
    }
  }

  return { ok: true, patch };
}

/** @param {import("sequelize").Model | Record<string, any>} pref */
function asHousingPreferencesResponse(pref) {
  const row = pref.get ? pref.get({ plain: true }) : pref;
  return {
    group_id: Number(row.group_id),
    preferred_bedrooms:
      row.preferred_bedrooms === null || row.preferred_bedrooms === undefined
        ? null
        : Number(row.preferred_bedrooms),
    // Return as string to preserve fixed decimal formatting expected by the UI.
    preferred_bathrooms:
      row.preferred_bathrooms === null || row.preferred_bathrooms === undefined
        ? null
        : String(row.preferred_bathrooms),
    preferred_floor: row.preferred_floor ?? null,
    amenities: row.amenities ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

module.exports = {
  validateHousingPreferencesPatch,
  asHousingPreferencesResponse,
};
