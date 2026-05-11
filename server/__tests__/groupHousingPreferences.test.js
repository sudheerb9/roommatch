const {
  validateHousingPreferencesPatch,
  asHousingPreferencesResponse,
} = require("../utils/groupHousingPreferences");

describe("validateHousingPreferencesPatch", () => {
  it("rejects non-objects", () => {
    expect(validateHousingPreferencesPatch(null).ok).toBe(false);
    expect(validateHousingPreferencesPatch([]).ok).toBe(false);
  });

  it("allows empty object", () => {
    expect(validateHousingPreferencesPatch({})).toEqual({
      ok: true,
      patch: {},
    });
  });

  it("rejects unknown keys", () => {
    expect(validateHousingPreferencesPatch({ x: 1 }).ok).toBe(false);
  });

  describe("preferred_bedrooms", () => {
    it("allows null", () => {
      expect(validateHousingPreferencesPatch({ preferred_bedrooms: null })).toEqual({
        ok: true,
        patch: { preferred_bedrooms: null },
      });
    });

    it("allows integers in range", () => {
      expect(validateHousingPreferencesPatch({ preferred_bedrooms: 3 })).toEqual({
        ok: true,
        patch: { preferred_bedrooms: 3 },
      });
    });

    it("rejects out of range", () => {
      expect(validateHousingPreferencesPatch({ preferred_bedrooms: 11 }).ok).toBe(false);
      expect(validateHousingPreferencesPatch({ preferred_bedrooms: 0 }).ok).toBe(false);
    });
  });

  describe("preferred_bathrooms", () => {
    it("truncates decimals to tenth", () => {
      expect(
        validateHousingPreferencesPatch({ preferred_bathrooms: 2.556 }),
      ).toEqual({ ok: true, patch: { preferred_bathrooms: 2.6 } });
    });

    it("parses numeric strings", () => {
      expect(
        validateHousingPreferencesPatch({ preferred_bathrooms: "3.41" }),
      ).toEqual({ ok: true, patch: { preferred_bathrooms: 3.4 } });
    });
  });

  describe("preferred_floor", () => {
    it("trims whitespace", () => {
      expect(
        validateHousingPreferencesPatch({ preferred_floor: "  low \n" }),
      ).toEqual({ ok: true, patch: { preferred_floor: "low" } });
    });

    it("rejects invalid enum", () => {
      expect(validateHousingPreferencesPatch({ preferred_floor: "roof" }).ok).toBe(false);
    });
  });

  describe("amenities", () => {
    it("allows empty object", () => {
      expect(validateHousingPreferencesPatch({ amenities: {} })).toEqual({
        ok: true,
        patch: { amenities: {} },
      });
    });

    it("rejects array", () => {
      expect(validateHousingPreferencesPatch({ amenities: [] }).ok).toBe(false);
    });
  });
});

describe("asHousingPreferencesResponse", () => {
  it("normalizes Sequelize and plain shapes", () => {
    expect(
      asHousingPreferencesResponse({
        get: () => ({
          group_id: 5,
          preferred_bedrooms: 2,
          preferred_bathrooms: 1,
          preferred_floor: "middle",
          amenities: { ac: true },
          created_at: null,
          updated_at: null,
        }),
      }),
    ).toEqual({
      group_id: 5,
      preferred_bedrooms: 2,
      preferred_bathrooms: "1",
      preferred_floor: "middle",
      amenities: { ac: true },
      created_at: null,
      updated_at: null,
    });
  });

  it("handles null-ish fields", () => {
    const row = { group_id: 1 };
    expect(asHousingPreferencesResponse(row)).toMatchObject({
      group_id: 1,
      preferred_bedrooms: null,
      preferred_bathrooms: null,
    });
  });
});
