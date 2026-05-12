jest.mock("../models", () => ({
  Group: { findByPk: jest.fn() },
  GroupMember: { findOne: jest.fn() },
}));

const { assertCanAccessGroup } = require("../utils/groupAccess");
const models = require("../models");

describe("assertCanAccessGroup", () => {
  beforeEach(() => {
    models.Group.findByPk.mockReset();
    models.GroupMember.findOne.mockReset();
  });

  it("returns 400 for invalid id format", async () => {
    const result = await assertCanAccessGroup("abc", { id: 1n });
    expect(result).toEqual({
      ok: false,
      status: 400,
      body: { error: "Invalid group id" },
    });
    expect(models.Group.findByPk).not.toHaveBeenCalled();
  });

  it("returns 404 when missing", async () => {
    models.Group.findByPk.mockResolvedValueOnce(null);

    const result = await assertCanAccessGroup("12", { id: 99 });
    expect(models.Group.findByPk).toHaveBeenCalledWith("12");
    expect(result).toEqual({
      ok: false,
      status: 404,
      body: { error: "Group not found" },
    });
  });

  it("allows owner without membership lookup", async () => {
    const group = {
      owner_user_id: BigInt("5"),
      id: BigInt("12"),
      get(field) {
        return this[field];
      },
    };
    models.Group.findByPk.mockResolvedValueOnce(group);

    const result = await assertCanAccessGroup("12", { id: BigInt("5") });
    expect(result.ok).toBe(true);
    expect(result.group).toBe(group);
    expect(result.membership).toBeNull();
    expect(models.GroupMember.findOne).not.toHaveBeenCalled();
  });

  it("checks membership for non-owner", async () => {
    const group = { owner_user_id: 99, id: 12 };
    models.Group.findByPk.mockResolvedValueOnce(group);
    models.GroupMember.findOne.mockResolvedValueOnce({ role: "member" });

    const result = await assertCanAccessGroup("12", { id: 1 });
    expect(result.ok).toBe(true);
    expect(result.membership).toEqual({ role: "member" });
    expect(models.GroupMember.findOne).toHaveBeenCalledWith({
      where: { group_id: 12, user_id: 1 },
    });
  });

  it("returns 403 when not member", async () => {
    models.Group.findByPk.mockResolvedValueOnce({ owner_user_id: 99, id: 10 });
    models.GroupMember.findOne.mockResolvedValueOnce(null);

    const result = await assertCanAccessGroup("10", { id: 1 });
    expect(result).toEqual({
      ok: false,
      status: 403,
      body: { error: "You do not belong to this group" },
    });
  });
});
