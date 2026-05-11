const { GroupAssignment, HousingUnit } = require("../models");

function getAssignedGroupHousing(groupId) {
  return GroupAssignment.findOne({
    where: { group_id: groupId, status: "assigned" },
    include: [{ model: HousingUnit, as: "housingUnit" }],
    order: [["assigned_at", "DESC"]],
  });
}

function lockAvailableHousingUnit(unitId, transaction) {
  return HousingUnit.findByPk(unitId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  }).then((unit) => {
    if (!unit || !unit.is_available) {
      return null;
    }
    return unit;
  });
}

function createGroupAssignment(groupId, unitId, transaction) {
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

function markHousingUnitUnavailable(unit, transaction) {
  return unit.update({ is_available: false }, { transaction });
}

module.exports = {
  getAssignedGroupHousing,
  lockAvailableHousingUnit,
  createGroupAssignment,
  markHousingUnitUnavailable,
};
