jest.mock("../utils/logger", () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock("../utils/authToken", () => ({
  verifyBearerToken: jest.fn(() => ({
    sub: "user@example.com",
  })),
}));

jest.mock("../models", () => ({
  User: {
    findOne: jest.fn(),
  },
}));

const {
  authenticate,
  extractBearerToken,
} = require("../middleware/authenticate");
const { User } = require("../models");
const { verifyBearerToken } = require("../utils/authToken");

function mockReqRes() {
  const req = { headers: {} };
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  const next = jest.fn();
  return { req, res, next };
}

describe("authenticate middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("extractBearerToken parses Authorization header", () => {
    expect(
      extractBearerToken({ headers: { authorization: "Bearer abc.xyz" } }),
    ).toBe("abc.xyz");
    expect(extractBearerToken({ headers: {} })).toBeNull();
    expect(extractBearerToken({ headers: { authorization: "Basic xx" } })).toBeNull();
  });

  it("responds 401 when token missing", async () => {
    const { req, res, next } = mockReqRes();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("loads user and calls next when valid", async () => {
    const user = { id: 10, email: "user@example.com" };
    User.findOne.mockResolvedValueOnce(user);
    const { req, res, next } = mockReqRes();
    req.headers.authorization = "Bearer t";
    await authenticate(req, res, next);

    expect(verifyBearerToken).toHaveBeenCalledWith("t");
    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalled();
  });

  it("401 when user missing", async () => {
    User.findOne.mockResolvedValueOnce(null);
    const { req, res, next } = mockReqRes();
    req.headers.authorization = "Bearer t";
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("401 when sub invalid", async () => {
    verifyBearerToken.mockReturnValueOnce({ sub: 123 });
    const { req, res, next } = mockReqRes();
    req.headers.authorization = "Bearer t";
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("401 when verifyBearerToken throws", async () => {
    verifyBearerToken.mockImplementationOnce(() => {
      throw new Error("jwt");
    });
    const { req, res, next } = mockReqRes();
    req.headers.authorization = "Bearer bad";
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
