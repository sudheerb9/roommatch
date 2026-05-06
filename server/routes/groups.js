const express = require("express");
const { Op } = require("sequelize");

const {
  createGroup,
  getGroupMembers,
  getGroupMatches,
  declareGroupReady,
  assignGroupHousing,
  getGroupAssignment,
  listUserGroups,
  getGroupDetails,
} = require("../controllers/groupsController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeGroupAccess } = require("../middleware/groupAuthorization");
const {
  sequelize,
  Chat,
  Group,
  GroupMember,
  GroupInvitation,
  User,
  GroupHousingPreference,
  GroupAssignment,
  HousingUnit,
  Message,
} = require("../models");
const { assertCanAccessGroup } = require("../utils/groupAccess");
const { asInvitationResponse } = require("../utils/groupInvitationResponse");
const {
  validateHousingPreferencesPatch,
  asHousingPreferencesResponse,
} = require("../utils/groupHousingPreferences");

const router = express.Router();

function parseInviteeUserId(raw) {
  const n =
    typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isInteger(n) || n <= 0) {
    return null;
  }
  return n;
}

function parseInviteeUserIds(raw) {
  if (!Array.isArray(raw)) {
    return null;
  }
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    const n = parseInviteeUserId(item);
    if (n == null || seen.has(n)) {
      return null;
    }
    seen.add(n);
    out.push(n);
  }
  return out;
}

function asNumberId(raw) {
  return typeof raw === "bigint" ? Number(raw) : Number(raw);
}

function normalizeInvitationNote(raw) {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, 500);
}

async function validateInviteeForGroup({
  group,
  inviteeUserId,
  requesterUserId,
  transaction,
}) {
  const selfId =
    typeof requesterUserId === "bigint"
      ? requesterUserId.toString()
      : String(requesterUserId);
  if (String(inviteeUserId) === selfId) {
    return { ok: false, status: 400, error: "You cannot invite yourself" };
  }

  const invitee = await User.findByPk(inviteeUserId, { transaction });
  if (!invitee || !invitee.is_active) {
    return { ok: false, status: 404, error: "Invitee user not found" };
  }

  const anyMembership = await GroupMember.findOne({
    where: { user_id: inviteeUserId },
    transaction,
  });
  if (anyMembership) {
    const memberGroupId = asNumberId(anyMembership.group_id);
    if (memberGroupId === asNumberId(group.id)) {
      return {
        ok: false,
        status: 409,
        error: "User is already a member of this group",
      };
    }
    return {
      ok: false,
      status: 409,
      error: "User is already part of another group",
    };
  }

  const pendingDup = await GroupInvitation.findOne({
    where: {
      group_id: group.id,
      invitee_user_id: inviteeUserId,
      status: "pending",
    },
    transaction,
  });
  if (pendingDup) {
    return {
      ok: false,
      status: 409,
      error: "There is already a pending invitation for this user",
    };
  }

  return { ok: true, invitee };
}

router.post("/", authenticate, createGroup);
router.get("/", authenticate, listUserGroups);
router.get(
  "/:groupId/members",
  authenticate,
  authorizeGroupAccess,
  getGroupMembers,
);
router.get(
  "/:groupId/matches",
  authenticate,
  authorizeGroupAccess,
  getGroupMatches,
);
router.post("/:groupId/ready", authenticate, declareGroupReady);
router.post(
  "/:groupId/assign",
  authenticate,
  authorizeGroupAccess,
  assignGroupHousing,
);
router.get(
  "/:groupId/assignment",
  authenticate,
  authorizeGroupAccess,
  getGroupAssignment,
);

/** DELETE /groups/:groupId */
router.delete(
  "/:groupId",
  authenticate,
  async function deleteGroup(req, res, next) {
    try {
      const groupIdParam = req.params.groupId;
      if (typeof groupIdParam !== "string" || !/^\d+$/.test(groupIdParam)) {
        return res.status(400).json({ error: "Invalid group id" });
      }

      const group = await Group.findByPk(groupIdParam);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      const ownerId =
        typeof group.owner_user_id === "bigint"
          ? group.owner_user_id.toString()
          : String(group.owner_user_id);
      const requesterId =
        typeof req.user.id === "bigint" ? req.user.id.toString() : String(req.user.id);
      if (ownerId !== requesterId) {
        return res
          .status(403)
          .json({ error: "Only the group owner can delete this group" });
      }

      if (group.status === "assigned") {
        return res.status(409).json({
          error: "Assigned groups cannot be deleted",
        });
      }

      await sequelize.transaction(async (transaction) => {
        const lockedGroup = await Group.findByPk(group.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!lockedGroup) {
          const err = new Error("Group not found");
          err.statusCode = 404;
          throw err;
        }

        const assignments = await GroupAssignment.findAll({
          where: { group_id: lockedGroup.id },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        const assignedUnitIds = assignments
          .filter((assignment) => assignment.status === "assigned")
          .map((assignment) => assignment.housing_unit_id)
          .filter((id) => id != null);
        if (assignedUnitIds.length > 0) {
          await HousingUnit.update(
            { is_available: true },
            {
              where: { id: assignedUnitIds },
              transaction,
            },
          );
        }

        await GroupAssignment.destroy({
          where: { group_id: lockedGroup.id },
          transaction,
        });
        await GroupHousingPreference.destroy({
          where: { group_id: lockedGroup.id },
          transaction,
        });
        await GroupInvitation.destroy({
          where: { group_id: lockedGroup.id },
          transaction,
        });
        await GroupMember.destroy({
          where: { group_id: lockedGroup.id },
          transaction,
        });

        const chatId = lockedGroup.chat_id;
        if (chatId) {
          await Message.destroy({
            where: { chat_id: chatId },
            transaction,
          });
          await lockedGroup.update({ chat_id: null }, { transaction });
        }

        await lockedGroup.destroy({ transaction });

        if (chatId) {
          await Chat.destroy({
            where: { id: chatId },
            transaction,
          });
        }
      });

      return res.status(200).json({
        deleted: true,
        group_id: Number(group.id),
      });
    } catch (err) {
      if (err.statusCode === 404) {
        return res.status(404).json({ error: err.message });
      }
      return next(err);
    }
  },
);

/** GET /groups/:groupId/chat */
router.get(
  "/:groupId/chat",
  authenticate,
  async function getOrCreateGroupChat(req, res, next) {
    try {
      const access = await assertCanAccessGroup(req.params.groupId, req.user);
      if (!access.ok) {
        return res.status(access.status).json(access.body);
      }

      const chat = await sequelize.transaction(async (transaction) => {
        const lockedGroup = await Group.findByPk(access.group.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!lockedGroup) {
          const err = new Error("Group not found");
          err.statusCode = 404;
          throw err;
        }

        const members = await GroupMember.findAll({
          where: { group_id: lockedGroup.id },
          attributes: ["user_id"],
          order: [["user_id", "ASC"]],
          transaction,
        });
        const participantUserIds = members.map((member) => Number(member.user_id));
        if (participantUserIds.length < 1) {
          const err = new Error("Cannot create a group chat for an empty group");
          err.statusCode = 409;
          throw err;
        }

        if (lockedGroup.chat_id) {
          const existing = await Chat.findByPk(lockedGroup.chat_id, {
            transaction,
          });
          if (existing) {
            const existingIds = Array.isArray(existing.participant_user_ids)
              ? [...existing.participant_user_ids]
                  .map((id) => Number(id))
                  .filter((id) => Number.isInteger(id) && id > 0)
                  .sort((a, b) => a - b)
              : [];
            const nextIds = [...participantUserIds].sort((a, b) => a - b);
            const sameParticipants =
              existingIds.length === nextIds.length &&
              existingIds.every((id, idx) => id === nextIds[idx]);

            if (!sameParticipants) {
              await existing.update(
                { participant_user_ids: nextIds },
                { transaction },
              );
              await existing.reload({ transaction });
            }
            return existing;
          }
        }

        const created = await Chat.create(
          {
            kind: "group",
            participant_user_ids: participantUserIds,
          },
          { transaction },
        );

        await lockedGroup.update({ chat_id: created.id }, { transaction });
        return created;
      });

      return res.status(200).json({
        group: {
          id: Number(access.group.id),
          name: access.group.name,
          status: access.group.status,
        },
        chat: {
          id: Number(chat.id),
          kind: chat.kind,
          participant_user_ids: chat.participant_user_ids,
          created_at: chat.createdAt,
          updated_at: chat.updatedAt,
        },
      });
    } catch (err) {
      if (err.statusCode === 404) {
        return res.status(404).json({ error: err.message });
      }
      if (err.statusCode === 409) {
        return res.status(409).json({ error: err.message });
      }
      return next(err);
    }
  },
);

/** GET /groups/:groupId/invitations */
router.get(
  "/:groupId/invitations",
  authenticate,
  authorizeGroupAccess,
  async function listGroupInvitations(req, res, next) {
    try {
      const { group } = req;

      const invitations = await GroupInvitation.findAll({
        where: { group_id: group.id },
        include: [
          {
            model: User,
            as: "inviter",
            attributes: ["id", "email", "display_name"],
          },
          {
            model: User,
            as: "invitee",
            attributes: ["id", "email", "display_name"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return res.status(200).json({
        invitations: invitations.map((inv) => asInvitationResponse(inv)),
      });
    } catch (err) {
      return next(err);
    }
  },
);

/** GET /groups/:groupId/invite-candidates */
router.get(
  "/:groupId/invite-candidates",
  authenticate,
  async function listInviteCandidates(req, res, next) {
    try {
      const access = await assertCanAccessGroup(req.params.groupId, req.user);
      if (!access.ok) {
        return res.status(access.status).json(access.body);
      }
      const { group } = access;

      const rawLimit = Number(req.query.limit);
      const limit =
        Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 300) : 120;
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      const searchClause =
        q.length === 0
          ? {}
          : {
              [Op.or]: [
                { display_name: { [Op.like]: `%${q}%` } },
                { email: { [Op.like]: `%${q}%` } },
              ],
            };

      const currentGroupMembers = await GroupMember.findAll({
        where: { group_id: group.id },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "email", "display_name", "is_active"],
          },
        ],
        order: [
          [{ model: User, as: "user" }, "display_name", "ASC"],
          [{ model: User, as: "user" }, "email", "ASC"],
        ],
      });
      const currentMembers = currentGroupMembers
        .filter((member) => member.user && member.user.is_active)
        .map((member) => ({
          id: asNumberId(member.user.id),
          email: member.user.email,
          display_name: member.user.display_name ?? null,
          role: member.role,
        }));
      const currentMemberIdSet = new Set(currentMembers.map((m) => m.id));

      const users = await User.findAll({
        where: {
          is_active: true,
          ...searchClause,
        },
        attributes: ["id", "email", "display_name"],
        order: [
          ["display_name", "ASC"],
          ["email", "ASC"],
        ],
        limit,
      });

      if (users.length === 0) {
        return res.status(200).json({ current_members: currentMembers, candidates: [] });
      }

      const candidateIds = users.map((u) => asNumberId(u.id));
      const [memberships, pendingInvites] = await Promise.all([
        GroupMember.findAll({
          where: { user_id: { [Op.in]: candidateIds } },
          attributes: ["user_id"],
        }),
        GroupInvitation.findAll({
          where: {
            group_id: group.id,
            invitee_user_id: { [Op.in]: candidateIds },
            status: "pending",
          },
          attributes: ["invitee_user_id"],
        }),
      ]);

      const inAnyGroup = new Set(memberships.map((m) => asNumberId(m.user_id)));
      const pendingInThisGroup = new Set(
        pendingInvites.map((inv) => asNumberId(inv.invitee_user_id))
      );

      const candidates = users
        .filter((u) => {
          const id = asNumberId(u.id);
          if (currentMemberIdSet.has(id)) return false;
          return !inAnyGroup.has(id) && !pendingInThisGroup.has(id);
        })
        .map((u) => ({
          id: asNumberId(u.id),
          email: u.email,
          display_name: u.display_name ?? null,
        }));

      return res.status(200).json({ current_members: currentMembers, candidates });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /groups/:groupId/invitations */
router.post(
  "/:groupId/invitations",
  authenticate,
  authorizeGroupAccess,
  async function createGroupInvitation(req, res, next) {
    try {
      const { group } = req;
      const inviteeUserId = parseInviteeUserId(req.body.invitee_user_id);
      if (inviteeUserId == null) {
        return res
          .status(400)
          .json({ error: "invitee_user_id must be a positive integer" });
      }

      const selfId =
        typeof req.user.id === "bigint"
          ? req.user.id.toString()
          : String(req.user.id);
      if (String(inviteeUserId) === selfId) {
        return res.status(400).json({ error: "You cannot invite yourself" });
      }

      const invitee = await User.findByPk(inviteeUserId);
      if (!invitee || !invitee.is_active) {
        return res.status(404).json({ error: "Invitee user not found" });
      }

      const alreadyMember = await GroupMember.findOne({
        where: { group_id: group.id, user_id: inviteeUserId },
      });
      if (alreadyMember) {
        return res
          .status(409)
          .json({ error: "User is already a member of this group" });
      }

      const pendingDup = await GroupInvitation.findOne({
        where: {
          group_id: group.id,
          invitee_user_id: inviteeUserId,
          status: "pending",
        },
      });
      if (pendingDup) {
        return res.status(409).json({
          error: "There is already a pending invitation for this user",
        });
      }

      let normalizedNote = null;
      if (typeof req.body.note === "string") {
        const t = req.body.note.trim();
        if (t.length > 0) {
          normalizedNote = t.slice(0, 500);
        }
      }

      const invitation = await GroupInvitation.create({
        group_id: group.id,
        inviter_user_id: req.user.id,
        invitee_user_id: inviteeUserId,
        status: "pending",
        note: normalizedNote || null,
      });

      await invitation.reload({
        include: [
          {
            model: User,
            as: "inviter",
            attributes: ["id", "email", "display_name"],
          },
          {
            model: User,
            as: "invitee",
            attributes: ["id", "email", "display_name"],
          },
        ],
      });

      return res
        .status(201)
        .json({ invitation: asInvitationResponse(invitation) });
    } catch (err) {
      return next(err);
    }
  },
);

/** POST /groups/:groupId/invitations/batch */
router.post(
  "/:groupId/invitations/batch",
  authenticate,
  async function createBatchGroupInvitations(req, res, next) {
    try {
      const access = await assertCanAccessGroup(req.params.groupId, req.user);
      if (!access.ok) {
        return res.status(access.status).json(access.body);
      }
      const { group } = access;

      if (group.status !== "forming") {
        return res.status(409).json({
          error: "Invitations can only be sent while the group is forming",
        });
      }

      const inviteeUserIds = parseInviteeUserIds(req.body.invitee_user_ids);
      if (!inviteeUserIds || inviteeUserIds.length === 0) {
        return res.status(400).json({
          error:
            "invitee_user_ids must be a non-empty array of unique positive integers",
        });
      }
      if (inviteeUserIds.length > 100) {
        return res
          .status(400)
          .json({ error: "You can invite at most 100 users at a time" });
      }

      const normalizedNote = normalizeInvitationNote(req.body.note);
      const createdInvitations = [];
      const skipped = [];

      await sequelize.transaction(async (transaction) => {
        for (const inviteeUserId of inviteeUserIds) {
          const validation = await validateInviteeForGroup({
            group,
            inviteeUserId,
            requesterUserId: req.user.id,
            transaction,
          });
          if (!validation.ok) {
            skipped.push({
              invitee_user_id: inviteeUserId,
              error: validation.error,
            });
            continue;
          }

          const invitation = await GroupInvitation.create(
            {
              group_id: group.id,
              inviter_user_id: req.user.id,
              invitee_user_id: inviteeUserId,
              status: "pending",
              note: normalizedNote,
            },
            { transaction }
          );

          await invitation.reload({
            include: [
              {
                model: User,
                as: "inviter",
                attributes: ["id", "email", "display_name"],
              },
              {
                model: User,
                as: "invitee",
                attributes: ["id", "email", "display_name"],
              },
            ],
            transaction,
          });
          createdInvitations.push(asInvitationResponse(invitation));
        }
      });

      return res.status(200).json({
        invitations: createdInvitations,
        skipped,
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.get("/:groupId", authenticate, authorizeGroupAccess, getGroupDetails);
/** GET /groups/:groupId/housing-preferences */
router.get(
  "/:groupId/housing-preferences",
  authenticate,
  async function getGroupHousingPreferences(req, res, next) {
    try {
      const access = await assertCanAccessGroup(req.params.groupId, req.user);
      if (!access.ok) {
        return res.status(access.status).json(access.body);
      }

      const { group } = access;
      const pref = await GroupHousingPreference.findByPk(group.id);
      return res.status(200).json({
        housing_preferences: pref ? asHousingPreferencesResponse(pref) : null,
      });
    } catch (err) {
      return next(err);
    }
  },
);

/** PUT /groups/:groupId/housing-preferences */
router.put(
  "/:groupId/housing-preferences",
  authenticate,
  async function putGroupHousingPreferences(req, res, next) {
    try {
      const access = await assertCanAccessGroup(req.params.groupId, req.user);
      if (!access.ok) {
        return res.status(access.status).json(access.body);
      }

      const { group } = access;
      const validation = validateHousingPreferencesPatch(req.body);
      if (!validation.ok) {
        return res.status(400).json({ error: validation.error });
      }

      const patch = validation.patch || {};
      if (Object.keys(patch).length === 0) {
        const existing = await GroupHousingPreference.findByPk(group.id);
        return res.status(200).json({
          housing_preferences: existing
            ? asHousingPreferencesResponse(existing)
            : null,
        });
      }

      const [prefs] = await GroupHousingPreference.findOrCreate({
        where: { group_id: group.id },
      });

      await prefs.update(patch);
      await prefs.reload();

      return res.status(200).json({
        housing_preferences: asHousingPreferencesResponse(prefs),
      });
    } catch (err) {
      return next(err);
    }
  },
);

module.exports = router;
