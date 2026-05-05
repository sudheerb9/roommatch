const { Op } = require("sequelize");
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
const { config } = require("../config");
const { computeMatchScore } = require("../services/matchingService");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");
const {
  getAssignedGroupHousing,
  lockAvailableHousingUnit,
  createGroupAssignment,
  markHousingUnitUnavailable,
} = require("../utils/assignmentSafety");

const PREFERENCE_FIELDS = [
  "preferred_sleep_schedule",
  "preferred_cleanliness_level",
  "preferred_noise_tolerance",
  "preferred_smoking_preference",
  "preferred_drinking_preference",
  "preferred_social_behavior",
  "preferred_study_preferences",
];

function parsePositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function scoreFloorPreference(preferredFloor, floor) {
  if (!preferredFloor || preferredFloor === "any" || floor == null) {
    return 100;
  }
  if (preferredFloor === "low") {
    return floor <= 2 ? 100 : 0;
  }
  if (preferredFloor === "middle") {
    return floor >= 3 && floor <= 5 ? 100 : 0;
  }
  if (preferredFloor === "high") {
    return floor >= 6 ? 100 : 0;
  }
  return 0;
}

function scoreAmenities(preferredAmenities, unitAmenities) {
  if (!Array.isArray(preferredAmenities) || preferredAmenities.length === 0) {
    return 100;
  }
  if (!Array.isArray(unitAmenities) || unitAmenities.length === 0) {
    return 0;
  }

  const unitSet = new Set(unitAmenities.map((item) => String(item)));
  let hits = 0;
  for (const preferred of preferredAmenities) {
    if (unitSet.has(String(preferred))) {
      hits += 1;
    }
  }
  return Math.round((hits / preferredAmenities.length) * 100);
}

function scoreHousingUnit(unit, groupSize, housingPreference) {
  const inferredCapacity = unit.bedrooms * 2;
  const capacityScore = inferredCapacity >= groupSize ? 100 : 0;

  const preferredBedrooms = housingPreference?.preferred_bedrooms ?? null;
  const preferredBathrooms = housingPreference?.preferred_bathrooms ?? null;

  const bedroomScore =
    preferredBedrooms == null
      ? 100
      : Math.max(0, 100 - Math.abs(unit.bedrooms - preferredBedrooms) * 25);
  const bathroomScore =
    preferredBathrooms == null
      ? 100
      : Math.max(
          0,
          100 -
            Math.abs(Number(unit.bathrooms) - Number(preferredBathrooms)) * 40,
        );
  const floorScore = scoreFloorPreference(
    housingPreference?.preferred_floor,
    unit.floor,
  );
  const amenityScore = scoreAmenities(
    housingPreference?.amenities,
    unit.amenities,
  );

  const weighted =
    capacityScore * 0.4 +
    bedroomScore * 0.2 +
    bathroomScore * 0.15 +
    floorScore * 0.1 +
    amenityScore * 0.15;

  return Math.round(weighted);
}

function aggregatePreferences(groupPreferences) {
  const aggregate = {};

  for (const field of PREFERENCE_FIELDS) {
    const counts = new Map();
    for (const preference of groupPreferences) {
      const value = preference[field];
      if (!value || value === "no_preference") {
        continue;
      }
      counts.set(value, (counts.get(value) || 0) + 1);
    }

    if (counts.size === 0) {
      aggregate[field] = "no_preference";
      continue;
    }

    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) {
      aggregate[field] = "no_preference";
    } else {
      aggregate[field] = ranked[0][0];
    }
  }

  return aggregate;
}

async function listUserGroups(req, res, next) {
  try {
    const groups = await Group.findAll({
      where: {
        [Op.or]: [
          { owner_user_id: req.user.id },
          { "$members.user_id$": req.user.id },
        ],
      },
      include: [
        {
          model: GroupMember,
          as: "members",
          attributes: ["user_id"],
        },
      ],
      distinct: true,
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        status: group.status,
        owner_user_id: group.owner_user_id,
        member_count: group.members ? group.members.length : 0,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

async function getGroupDetails(req, res, next) {
  try {
    const group = await Group.findByPk(req.group.id, {
      include: [
        {
          model: GroupMember,
          as: "members",
          attributes: ["user_id"],
        },
      ],
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.status(200).json({
      group: {
        id: group.id,
        name: group.name,
        status: group.status,
        owner_user_id: group.owner_user_id,
        member_ids: group.members.map((member) => member.user_id),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getGroupMembers(req, res, next) {
  try {
    const groupId = parsePositiveInt(req.params.groupId);
    if (!groupId) {
      return res
        .status(400)
        .json({ error: "groupId must be a positive integer" });
    }

    const members = await GroupMember.findAll({
      where: { group_id: groupId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "display_name", "email"],
        },
      ],
      order: [
        ["joined_at", "ASC"],
        ["id", "ASC"],
      ],
    });

    return res.status(200).json({
      members: members.map((member) => ({
        id: member.user ? member.user.id : member.user_id,
        display_name: member.user ? member.user.display_name : null,
        email: member.user ? member.user.email : null,
        role: member.role,
        joined_at: member.joined_at,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

async function createGroup(req, res, next) {
  try {
    const rawName =
      typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!rawName) {
      return res.status(400).json({ error: "Group name is required" });
    }
    if (rawName.length > 120) {
      return res
        .status(400)
        .json({ error: "Group name must be 120 characters or fewer" });
    }

    const group = await sequelize.transaction(async (transaction) => {
      const createdGroup = await Group.create(
        {
          owner_user_id: req.user.id,
          name: rawName,
          status: "forming",
        },
        { transaction },
      );

      await GroupMember.create(
        {
          group_id: createdGroup.id,
          user_id: req.user.id,
          role: "owner",
        },
        { transaction },
      );

      return createdGroup;
    });

    return res.status(201).json({
      group: {
        id: group.id,
        name: group.name,
        status: group.status,
        owner_user_id: group.owner_user_id,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getGroupMatches(req, res, next) {
  try {
    const groupId = parsePositiveInt(req.params.groupId);
    if (!groupId) {
      return res
        .status(400)
        .json({ error: "groupId must be a positive integer" });
    }

    const group = req.group;

    const groupMembers = await GroupMember.findAll({
      where: { group_id: groupId },
      attributes: ["user_id"],
    });
    const memberUserIds = groupMembers.map((member) => member.user_id);

    const memberPreferences = await MatchPreference.findAll({
      where: { user_id: { [Op.in]: memberUserIds } },
      attributes: ["user_id", ...PREFERENCE_FIELDS],
    });
    const aggregatePreference = aggregatePreferences(memberPreferences);

    const pendingInvitations = await GroupInvitation.findAll({
      where: { group_id: groupId, status: "pending" },
      attributes: ["invitee_user_id"],
    });
    const pendingInviteeIds = pendingInvitations.map(
      (invitation) => invitation.invitee_user_id,
    );

    const excludedIds = new Set([...memberUserIds, ...pendingInviteeIds]);
    const candidateProfiles = await Profile.findAll({
      where: { user_id: { [Op.notIn]: [...excludedIds] } },
      attributes: [
        "user_id",
        "sleep_schedule",
        "cleanliness_level",
        "noise_tolerance",
        "smoking_preference",
        "drinking_preference",
        "social_behavior",
        "study_preferences",
      ],
    });
    if (candidateProfiles.length === 0) {
      return res.json({
        items: [],
        aggregate_preference: aggregatePreference,
        meta: buildPaginationMeta({ page: 1, limit: 20, count: 0 }),
      });
    }

    const candidateIds = candidateProfiles.map((profile) => profile.user_id);
    const users = await User.findAll({
      where: { id: { [Op.in]: candidateIds }, is_active: true },
      attributes: ["id", "display_name", "email"],
    });
    const usersById = new Map(users.map((user) => [user.id, user]));

    const threshold = config.matching.threshold;
    const scoredItems = candidateProfiles
      .map((profile) => {
        const candidate = usersById.get(profile.user_id);
        if (!candidate) {
          return null;
        }

        const score = computeMatchScore(aggregatePreference, profile);
        return {
          user_id: candidate.id,
          display_name: candidate.display_name,
          email: candidate.email,
          score,
        };
      })
      .filter(Boolean)
      .filter((item) => item.score >= threshold)
      .sort((a, b) => b.score - a.score || a.user_id - b.user_id);

    const pagination = getPagination(req.query, { limit: 20, maxLimit: 50 });
    const pagedItems = scoredItems.slice(
      pagination.offset,
      pagination.offset + pagination.limit,
    );

    return res.json({
      items: pagedItems,
      aggregate_preference: aggregatePreference,
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        count: pagedItems.length,
      }),
    });
  } catch (error) {
    return next(error);
  }
}

async function assignGroupHousing(req, res, next) {
  try {
    const groupId = parsePositiveInt(req.params.groupId);
    if (!groupId) {
      return res
        .status(400)
        .json({ error: "groupId must be a positive integer" });
    }

    const group = req.group;

    const existingAssignment = await getAssignedGroupHousing(groupId);
    if (existingAssignment) {
      return res.status(200).json({ assignment: existingAssignment });
    }

    const [membersCount, housingPreference, availableUnits] = await Promise.all(
      [
        GroupMember.count({ where: { group_id: groupId } }),
        GroupHousingPreference.findByPk(groupId),
        HousingUnit.findAll({ where: { is_available: true } }),
      ],
    );

    if (availableUnits.length === 0) {
      return res
        .status(409)
        .json({ error: "No available housing units for assignment" });
    }

    const ranked = availableUnits
      .map((unit) => ({
        unit,
        score: scoreHousingUnit(unit, membersCount, housingPreference),
      }))
      .sort((a, b) => b.score - a.score || a.unit.id - b.unit.id);

    const winner = ranked[0];
    if (!winner) {
      return res.status(409).json({ error: "Unable to select a housing unit" });
    }

    const assignment = await sequelize.transaction(async (transaction) => {
      const unit = await lockAvailableHousingUnit(winner.unit.id, transaction);
      if (!unit) {
        throw new Error("Selected housing unit is no longer available");
      }

      const createdAssignment = await createGroupAssignment(
        groupId,
        unit.id,
        transaction,
      );

      await markHousingUnitUnavailable(unit, transaction);
      await group.update({ status: "assigned" }, { transaction });

      return createdAssignment;
    });

    const fullAssignment = await GroupAssignment.findByPk(assignment.id, {
      include: [{ model: HousingUnit, as: "housingUnit" }],
    });

    return res.status(201).json({ assignment: fullAssignment });
  } catch (error) {
    return next(error);
  }
}

async function getGroupAssignment(req, res, next) {
  try {
    const groupId = parsePositiveInt(req.params.groupId);
    if (!groupId) {
      return res
        .status(400)
        .json({ error: "groupId must be a positive integer" });
    }

    const group = req.group;

    const assignment = await GroupAssignment.findOne({
      where: { group_id: groupId, status: "assigned" },
      include: [{ model: HousingUnit, as: "housingUnit" }],
      order: [["assigned_at", "DESC"]],
    });

    if (!assignment) {
      return res
        .status(404)
        .json({ error: "No assignment found for this group" });
    }

    return res.status(200).json({ assignment });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createGroup,
  getGroupMembers,
  getGroupMatches,
  assignGroupHousing,
  getGroupAssignment,
  listUserGroups,
  getGroupDetails,
};
