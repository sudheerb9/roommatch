const jwt = require("jsonwebtoken");
const {
  generateBearerToken,
  verifyBearerToken,
} = require("../utils/authToken");
const { config } = require("../config");

describe("authToken", () => {
  it("generateBearerToken throws without email", () => {
    expect(() => generateBearerToken(null)).toThrow();
    expect(() => generateBearerToken({})).toThrow();
  });

  it("round-trips JWT with expected claims", () => {
    const token = generateBearerToken({ email: "u@example.com" });
    const payload = jwt.decode(token);

    expect(payload.sub).toBe("u@example.com");
    expect(payload.iss).toBe("roommatch-api");

    const verified = verifyBearerToken(token);
    expect(verified.sub).toBe("u@example.com");
    expect(typeof verified.exp).toBe("number");
  });

  it("verify rejects wrong secret tampered token", () => {
    const token = generateBearerToken({ email: "u@example.com" });
    const parts = token.split(".");
    const tampered =
      jwt.sign(JSON.parse(Buffer.from(parts[1], "base64url").toString()), "wrong-secret", {
        algorithm: "HS256",
      });
    expect(() => verifyBearerToken(tampered)).toThrow();
  });

  it("uses configured JWT secret module", () => {
    expect(config.auth.jwtSecret).toEqual(expect.any(String));
  });
});
