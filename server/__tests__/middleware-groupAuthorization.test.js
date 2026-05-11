jest.mock("../utils/groupAccess");

const groupAccess = require("../utils/groupAccess");
const { authorizeGroupAccess } = require("../middleware/groupAuthorization");

describe("authorizeGroupAccess", () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fills req.group when access ok", async () => {
    const group = { id: 9 };
    const membership = {};
    groupAccess.assertCanAccessGroup.mockResolvedValueOnce({
      ok: true,
      group,
      membership,
    });

    const req = { params: { groupId: "9" }, user: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await authorizeGroupAccess(req, res, next);
    expect(req.group).toBe(group);
    expect(req.groupMembership).toBe(membership);
    expect(next).toHaveBeenCalled();
  });

  it("responds with access body when forbidden", async () => {
    groupAccess.assertCanAccessGroup.mockResolvedValueOnce({
      ok: false,
      status: 403,
      body: { error: "nope" },
    });

    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    await authorizeGroupAccess({ params: { groupId: "1" }, user: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "nope" });
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards exceptions", async () => {
    const err = new Error("boom");
    groupAccess.assertCanAccessGroup.mockRejectedValueOnce(err);
    await expect(
      authorizeGroupAccess(
        { params: { groupId: "1" }, user: {} },
        {},
        next,
      ),
    ).resolves.not.toThrow();
    expect(next).toHaveBeenCalledWith(err);
  });
});
