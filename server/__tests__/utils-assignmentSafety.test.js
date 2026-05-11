jest.mock("../models", () => ({
  GroupAssignment: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  HousingUnit: {
    findByPk: jest.fn(),
  },
}));

const assignmentSafety = require("../utils/assignmentSafety");
const { GroupAssignment, HousingUnit } = require("../models");

describe("assignmentSafety", () => {
  const trx = {
    LOCK: { UPDATE: "UPDATE" },
  };

  beforeEach(() => {
    GroupAssignment.findOne.mockReset();
    GroupAssignment.create.mockReset();
    HousingUnit.findByPk.mockReset();
  });

  it("getAssignedGroupHousing delegates to Sequelize", async () => {
    GroupAssignment.findOne.mockResolvedValueOnce({ id: 1 });
    await expect(assignmentSafety.getAssignedGroupHousing(9)).resolves.toEqual({
      id: 1,
    });
    expect(GroupAssignment.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { group_id: 9, status: "assigned" },
      }),
    );
  });

  it("lockAvailableHousingUnit returns unit when available", async () => {
    const unit = {
      id: 3,
      is_available: true,
    };
    HousingUnit.findByPk.mockResolvedValueOnce(unit);

    await expect(
      assignmentSafety.lockAvailableHousingUnit(3, trx),
    ).resolves.toBe(unit);
  });

  it("lockAvailableHousingUnit returns null when missing or unavailable", async () => {
    HousingUnit.findByPk.mockResolvedValueOnce(null);
    await expect(
      assignmentSafety.lockAvailableHousingUnit(9, trx),
    ).resolves.toBeNull();

    HousingUnit.findByPk.mockResolvedValueOnce({ is_available: false });
    await expect(
      assignmentSafety.lockAvailableHousingUnit(9, trx),
    ).resolves.toBeNull();
  });

  it("passes through Sequelize create/update", async () => {
    GroupAssignment.create.mockResolvedValueOnce({ id: "a" });
    await expect(
      assignmentSafety.createGroupAssignment(1, 2, trx),
    ).resolves.toEqual({ id: "a" });

    const fakeUnit = { update: jest.fn().mockResolvedValue(undefined) };
    await assignmentSafety.markHousingUnitUnavailable(fakeUnit, trx);
    expect(fakeUnit.update).toHaveBeenCalledWith(
      { is_available: false },
      { transaction: trx },
    );
  });
});
