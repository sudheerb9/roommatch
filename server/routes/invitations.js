const express = require("express");

const { authenticate } = require("../middleware/authenticate");
const {
  sequelize,
  GroupInvitation,
  GroupMember,
  User,
} = require("../models");
const { asInvitationResponse } = require("../utils/groupInvitationResponse");

const router = express.Router();

async function reloadInvitation(invitation) {
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
}

/** POST /invitations/:invitationId/respond */
router.post(
  "/:invitationId/respond",
  authenticate,
  async function respondToInvitation(req, res, next) {
    try {
      const idParam =
        typeof req.params.invitationId === "string"
          ? req.params.invitationId
          : "";
      if (!/^\d+$/.test(idParam)) {
        return res.status(400).json({ error: "Invalid invitation id" });
      }

      const action = req.body.action;
      if (action !== "accept" && action !== "reject") {
        return res.status(400).json({
          error: 'Body must include action: "accept" or "reject"',
        });
      }

      const invitation = await GroupInvitation.findByPk(idParam);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      const inviteeId =
        typeof invitation.invitee_user_id === "bigint"
          ? invitation.invitee_user_id.toString()
          : String(invitation.invitee_user_id);
      const viewerId =
        typeof req.user.id === "bigint"
          ? req.user.id.toString()
          : String(req.user.id);
      if (inviteeId !== viewerId) {
        return res.status(403).json({
          error: "Only the invitee may respond to this invitation",
        });
      }

      if (invitation.status !== "pending") {
        return res.status(409).json({
          error: `Invitation is already ${invitation.status}`,
        });
      }

      if (action === "reject") {
        await invitation.update({
          status: "rejected",
          responded_at: new Date(),
        });
        await reloadInvitation(invitation);
        return res.status(200).json({
          invitation: asInvitationResponse(invitation),
        });
      }

      await sequelize.transaction(async (transaction) => {
        const pendingInv = await GroupInvitation.findOne({
          where: {
            id: invitation.id,
            invitee_user_id: req.user.id,
            status: "pending",
          },
          transaction,
        });
        if (!pendingInv) {
          const err = new Error("Invitation no longer pending");
          /** @type {any} */ (err).statusCode = 409;
          throw err;
        }

        await pendingInv.update(
          {
            status: "accepted",
            responded_at: new Date(),
          },
          { transaction },
        );

        await GroupMember.findOrCreate({
          where: {
            group_id: pendingInv.group_id,
            user_id: req.user.id,
          },
          defaults: {
            role: "member",
          },
          transaction,
        });
      });

      await reloadInvitation(invitation);
      return res.status(200).json({
        invitation: asInvitationResponse(invitation),
      });
    } catch (err) {
      if (/** @type {any} */ (err).statusCode === 409) {
        return res.status(409).json({ error: err.message });
      }
      return next(err);
    }
  },
);

module.exports = router;
