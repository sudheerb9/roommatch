const express = require("express");

const {
  getGroupMatches,
  declareGroupReady,
  assignGroupHousing,
  getGroupAssignment,
  listUserGroups,
  getGroupDetails,
} = require("../controllers/groupsController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeGroupAccess } = require("../middleware/groupAuthorization");
const { GroupMember, GroupInvitation, User, GroupHousingPreference } = require("../models");
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

router.get("/", authenticate, listUserGroups);
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
