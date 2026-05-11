const { userAccountIsActive } = require("../utils/userAccount");

describe("userAccountIsActive", () => {
  it("returns false for missing user", () => {
    expect(userAccountIsActive(null)).toBe(false);
    expect(userAccountIsActive(undefined)).toBe(false);
  });

  it("reads Sequelize model getter", () => {
    expect(
      userAccountIsActive({ get: (key) => (key === "is_active" ? true : undefined) }),
    ).toBe(true);
    expect(
      userAccountIsActive({ get: (key) => (key === "is_active" ? false : undefined) }),
    ).toBe(false);
  });

  it("reads plain objects", () => {
    expect(userAccountIsActive({ is_active: true })).toBe(true);
    expect(userAccountIsActive({ is_active: false })).toBe(false);
    expect(userAccountIsActive({ is_active: 0 })).toBe(false);
    expect(userAccountIsActive({})).toBe(true);
  });
});
