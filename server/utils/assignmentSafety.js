const { GroupAssignment, HousingUnit } = require("../models");

async function getAssignedGroupHousing(groupId) {
  return GroupAssignment.findOne({
    where: { group_id: groupId, status: "assigned" },
    include: [{ model: HousingUnit, as: "housingUnit" }],
    order: [["assigned_at", "DESC"]],
  });
}

async function lockAvailableHousingUnit(unitId, transaction) {
  // Row lock ensures parallel assignment attempts cannot both reserve the same unit.
  const unit = await HousingUnit.findByPk(unitId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!unit || !unit.is_available) {
    return null;
  }
  return unit;
}

async function createGroupAssignment(groupId, unitId, transaction) {
  return GroupAssignment.create(
    {
      group_id: groupId,
      housing_unit_id: unitId,
      status: "assigned",
      assigned_at: new Date(),
    },
    { transaction },
  );
}

async function markHousingUnitUnavailable(unit, transaction) {
  return unit.update({ is_available: false }, { transaction });
}

module.exports = {
  getAssignedGroupHousing,
  lockAvailableHousingUnit,
  createGroupAssignment,
  markHousingUnitUnavailable,
};
