const crypto = require("crypto");
const {
  createPasswordHash,
  verifyPassword,
  createSessionToken,
  signSessionToken,
  verifySessionToken,
} = require("../utils/auth");

describe("utils/auth password & session JWT", () => {
  it("hashes verify round-trip", () => {
    const { salt, hash } = createPasswordHash("Correct Horse Battery Staple!");
    expect(verifyPassword("Correct Horse Battery Staple!", salt, hash)).toBe(true);
    expect(verifyPassword("wrong", salt, hash)).toBe(false);
  });

  it("verifyPassword false when inputs missing", () => {
    expect(verifyPassword("x", "", "abc")).toBe(false);
  });

  it("follows UUID path", () => {
    const spy = jest.spyOn(crypto, "randomUUID").mockReturnValue("uuid-fixed");
    try {
      expect(createSessionToken()).toBe("uuid-fixed");
    } finally {
      spy.mockRestore();
    }
  });

  it("signs session token and verifies", () => {
    const token = signSessionToken("sess-123");
    const decoded = verifySessionToken(token);
    expect(decoded.sessionToken).toBe("sess-123");
  });

  it("verifySessionToken rejects bad token", () => {
    expect(() => verifySessionToken("not-a-valid-jwt")).toThrow();
  });
});
