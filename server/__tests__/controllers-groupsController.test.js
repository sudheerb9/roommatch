jest.mock("../models", () => ({
  sequelize: {
    transaction: jest.fn(),
    fn: jest.fn(),
    col: jest.fn(),
  },
  Group: {
    findAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  GroupMember: {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  },
  GroupInvitation: { findAll: jest.fn(), findOne: jest.fn() },
  GroupHousingPreference: { findByPk: jest.fn() },
  HousingUnit: { findAll: jest.fn() },
  GroupAssignment: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  MatchPreference: { findAll: jest.fn() },
  Profile: { findAll: jest.fn() },
  User: { findAll: jest.fn(), findOne: jest.fn() },
}));

jest.mock("../services/matchingService", () => ({
  computeMatchScore: jest.fn(() => 95),
}));

jest.mock("../utils/assignmentSafety", () => ({
  lockAvailableHousingUnit: jest.fn().mockResolvedValue({ id: 1, update: jest.fn() }),
  createGroupAssignment: jest.fn().mockResolvedValue({ id: 99 }),
  markHousingUnitUnavailable: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../utils/groupAccess", () => ({
  assertCanAccessGroup: jest.fn(),
}));

const {
  sequelize,
  Group,
  GroupMember,
  GroupInvitation,
  GroupHousingPreference,
  HousingUnit,
  GroupAssignment,
  MatchPreference,
  Profile,
  User,
} = require("../models");
const matchingService = require("../services/matchingService");
const { assertCanAccessGroup } = require("../utils/groupAccess");
const groupsController = require("../controllers/groupsController");

function resMock() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const ownerUser = { id: BigInt("1"), email: "o@test.com", display_name: "O", is_active: true };

describe("groupsController", () => {
  const tx = { LOCK: { UPDATE: "UPDATE" } };

  beforeEach(() => {
    jest.clearAllMocks();

    sequelize.transaction.mockImplementation((cb) => cb(tx));

    sequelize.fn = jest.fn((name, ...args) => [name, ...args]);
    sequelize.col = jest.fn((col) => col);

    matchingService.computeMatchScore.mockImplementation(() => 95);

    assertCanAccessGroup.mockResolvedValue({
      ok: true,
      group: {
        id: 10,
        owner_user_id: BigInt("1"),
        status: "forming",
        name: "G",
      },
      membership: {},
    });
  });

  it("lists groups with aggregates", async () => {
    Group.findAll.mockResolvedValueOnce([
      {
        id: 20,
        name: "A",
        status: "forming",
        owner_user_id: BigInt("1"),
        members: [{ user_id: BigInt("1"), role: "owner" }],
        owner: { display_name: "O", email: "o@test.com" },
      },
    ]);

    GroupMember.findAll.mockResolvedValueOnce([
      {
        group_id: 20,
        member_count: 2,
      },
    ]);

    const res = resMock();
    await groupsController.listUserGroups({ user: ownerUser }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(Group.findAll).toHaveBeenCalled();
  });

  it("blocks blank titles", async () => {
    const res = resMock();
    await groupsController.createGroup({ user: ownerUser, body: { name: "   " } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("allows owners to bootstrap groups + membership", async () => {
    Group.create.mockResolvedValueOnce({
      id: 42,
      name: "Hive",
      status: "forming",
      owner_user_id: ownerUser.id,
    });
    GroupMember.create.mockResolvedValue({});

    const res = resMock();
    await groupsController.createGroup({ user: ownerUser, body: { name: "Hive" } }, res, jest.fn());
    expect(Group.create).toHaveBeenCalled();
    expect(GroupMember.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("returns group façade + validates member lookups", async () => {
    Group.findByPk.mockResolvedValueOnce({
      id: 8,
      name: "G",
      status: "forming",
      owner_user_id: ownerUser.id,
      members: [],
      owner: { display_name: "O", email: "o@test.com" },
    });

    await groupsController.getGroupDetails(
      { user: ownerUser, group: { id: 8 } },
      resMock(),
      jest.fn(),
    );

    const badPaging = resMock();
    await groupsController.getGroupMembers(
      { user: ownerUser, params: { groupId: "-1" } },
      badPaging,
      jest.fn(),
    );

    expect(badPaging.status).toHaveBeenCalledWith(400);
  });

  it("shields match previews from outsiders", async () => {
    Group.findByPk.mockResolvedValueOnce({ id: 1, owner_user_id: 404 });
    GroupMember.findOne.mockResolvedValueOnce(null);

    const res = resMock();
    await groupsController.getGroupMatches(
      { user: ownerUser, params: { groupId: "1" }, query: {} },
      res,
      jest.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("materializes pooled candidates for members", async () => {
    const groupPayload = {
      id: 5,
      owner_user_id: ownerUser.id,
    };
    Group.findByPk.mockResolvedValueOnce(groupPayload);
    GroupMember.findOne.mockResolvedValueOnce({});
    GroupMember.findAll.mockResolvedValueOnce([{ user_id: ownerUser.id }]);
    MatchPreference.findAll.mockResolvedValueOnce([]);
    GroupInvitation.findAll.mockResolvedValueOnce([]);
    Profile.findAll.mockResolvedValueOnce([
      {
        user_id: 202,
        sleep_schedule: "early_bird",
        cleanliness_level: "clean",
        noise_tolerance: "sensitive",
        smoking_preference: "no",
        drinking_preference: "no",
        social_behavior: "social",
        study_preferences: "studious",
      },
    ]);

    User.findAll.mockResolvedValueOnce([
      { id: 202, display_name: "Buddy", email: "b@test.com", is_active: true },
    ]);

    const res = resMock();
    await groupsController.getGroupMatches(
      {
        user: ownerUser,
        params: { groupId: String(groupPayload.id) },
        query: {},
      },
      res,
      jest.fn(),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.any(Array),
      }),
    );
  });

  it("returns 404 when group id mismatches datastore", async () => {
    Group.findByPk.mockResolvedValueOnce(null);
    const res = resMock();
    await groupsController.getGroupMatches(
      { user: ownerUser, params: { groupId: "555" }, query: {} },
      res,
      jest.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("handles declare-ready idempotency branches", async () => {
    const groupStub = {
      id: 3,
      owner_user_id: ownerUser.id,
      status: "forming",
      name: "House",
      update: jest.fn().mockResolvedValue(undefined),
      reload: jest.fn().mockResolvedValue(undefined),
    };

    assertCanAccessGroup.mockResolvedValue({
      ok: true,
      group: groupStub,
      membership: {},
    });
    GroupHousingPreference.findByPk.mockResolvedValueOnce({});

    const res = resMock();

    await groupsController.declareGroupReady(
      { user: ownerUser, params: { groupId: "3" } },
      res,
      jest.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(groupStub.update).toHaveBeenCalled();
  });

  it("treats readiness as no-op when status already ready", async () => {
    const groupStub = {
      id: 4,
      owner_user_id: ownerUser.id,
      status: "ready",
      name: "Set",
      update: jest.fn(),
    };
    assertCanAccessGroup.mockResolvedValue({
      ok: true,
      group: groupStub,
      membership: {},
    });

    const res = resMock();
    await groupsController.declareGroupReady(
      { user: ownerUser, params: { groupId: "4" } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(groupStub.update).not.toHaveBeenCalled();
  });

  it("guards conflicting readiness transitions", async () => {
    for (const status of ["assigned", "archived"]) {
      jest.clearAllMocks();
      assertCanAccessGroup.mockResolvedValue({
        ok: true,
        group: {
          id: 6,
          owner_user_id: ownerUser.id,
          status,
        },
        membership: {},
      });

      const res = resMock();
      await groupsController.declareGroupReady(
        { user: ownerUser, params: { groupId: "6" } },
        res,
        jest.fn(),
      );

      expect(res.status).toHaveBeenCalledWith(409);
    }
  });

  it("forces housing preference capture before declaring ready", async () => {
    assertCanAccessGroup.mockResolvedValue({
      ok: true,
      group: {
        id: 7,
        owner_user_id: ownerUser.id,
        status: "forming",
      },
      membership: {},
    });
    GroupHousingPreference.findByPk.mockResolvedValueOnce(null);

    const res = resMock();
    await groupsController.declareGroupReady(
      { user: ownerUser, params: { groupId: "7" } },
      res,
      jest.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("returns 404 assignments when datastore lacks rows", async () => {
    Group.findByPk.mockResolvedValueOnce({ id: 2, owner_user_id: ownerUser.id });
    GroupMember.findOne.mockResolvedValueOnce({});
    GroupAssignment.findOne.mockResolvedValueOnce(null);

    const res404 = resMock();
    await groupsController.getGroupAssignment(
      { user: ownerUser, params: { groupId: "2" } },
      res404,
      jest.fn(),
    );
    expect(res404.status).toHaveBeenCalledWith(404);

    Group.findByPk.mockResolvedValueOnce(null);
    const resMissingGroup = resMock();
    await groupsController.getGroupAssignment(
      { user: ownerUser, params: { groupId: "99" } },
      resMissingGroup,
      jest.fn(),
    );
    expect(resMissingGroup.status).toHaveBeenCalledWith(404);
  });

  it("aggregates ambiguous member preferences deterministically", async () => {
    const groupPayload = { id: 40, owner_user_id: ownerUser.id };
    Group.findByPk.mockResolvedValueOnce(groupPayload);
    GroupMember.findOne.mockResolvedValueOnce({});
    GroupMember.findAll.mockResolvedValueOnce([{ user_id: 101 }, { user_id: 102 }]);
    GroupInvitation.findAll.mockResolvedValueOnce([]);
    Profile.findAll.mockResolvedValueOnce([]);

    MatchPreference.findAll.mockResolvedValueOnce([
      {
        user_id: 101,
        preferred_sleep_schedule: "early_bird",
        preferred_cleanliness_level: "clean",
        preferred_noise_tolerance: "sensitive",
        preferred_smoking_preference: "no",
        preferred_drinking_preference: "no",
        preferred_social_behavior: "social",
        preferred_study_preferences: "studious",
      },
      {
        user_id: 102,
        preferred_sleep_schedule: "night_owl",
        preferred_cleanliness_level: "relaxed",
        preferred_noise_tolerance: "tolerant",
        preferred_smoking_preference: "yes",
        preferred_drinking_preference: "yes",
        preferred_social_behavior: "moderate",
        preferred_study_preferences: "moderate",
      },
    ]);

    const resEmpty = resMock();
    await groupsController.getGroupMatches(
      {
        user: ownerUser,
        params: { groupId: String(groupPayload.id) },
        query: {},
      },
      resEmpty,
      jest.fn(),
    );
    expect(resEmpty.json.mock.calls[0][0]).toHaveProperty("aggregate_preference");
  });

  it("assign housing short circuits when persisted assignment detected", async () => {
    const groupPayload = {
      status: "ready",
      owner_user_id: ownerUser.id,
      update: jest.fn(),
      id: 11,
    };

    Group.findByPk.mockResolvedValueOnce(groupPayload);
    GroupMember.findOne.mockResolvedValueOnce({});
    GroupAssignment.findOne.mockResolvedValueOnce({ id: 9, housingUnit: {} });

    const res = resMock();
    await groupsController.assignGroupHousing(
      { user: ownerUser, params: { groupId: "11" } },
      res,
      jest.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("assign housing rejects groups still assembling", async () => {
    const groupPayload = { id: 12, status: "forming", owner_user_id: ownerUser.id, update: jest.fn() };

    Group.findByPk.mockResolvedValue(groupPayload);
    GroupMember.findOne.mockResolvedValue({});
    GroupAssignment.findOne.mockResolvedValue(null);

    const res = resMock();
    await groupsController.assignGroupHousing(
      { user: ownerUser, params: { groupId: "12" } },
      res,
      jest.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("assign housing ranks units atomically once readiness holds", async () => {
    const groupPayload = { id: 8, status: "ready", owner_user_id: ownerUser.id, update: jest.fn() };

    Group.findByPk.mockResolvedValue(groupPayload);
    GroupMember.findOne.mockResolvedValue({});
    GroupAssignment.findOne.mockResolvedValue(null);
    GroupMember.count.mockResolvedValue(2);
    GroupHousingPreference.findByPk.mockResolvedValue(null);

    HousingUnit.findAll.mockResolvedValue([
      {
        id: 50,
        bedrooms: 2,
        bathrooms: 1,
        floor: 5,
        amenities: [],
        is_available: true,
      },
    ]);

    GroupAssignment.findByPk.mockResolvedValue({ id: 99, housingUnit: {} });

    const res = resMock();

    await groupsController.assignGroupHousing(
      { user: ownerUser, params: { groupId: "8" } },
      res,
      jest.fn(),
    );

    expect(sequelize.transaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(GroupAssignment.findByPk).toHaveBeenCalled();
  });

  it("shows assignment payloads for members only", async () => {
    Group.findByPk.mockResolvedValue({ id: 4, owner_user_id: ownerUser.id });
    GroupMember.findOne.mockResolvedValue({});
    GroupAssignment.findOne.mockResolvedValue({
      id: 1,
      status: "assigned",
      housingUnit: {},
    });

    const res = resMock();
    await groupsController.getGroupAssignment(
      { user: ownerUser, params: { groupId: "4" } },
      res,
      jest.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
