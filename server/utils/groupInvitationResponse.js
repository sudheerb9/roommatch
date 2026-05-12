// Shared helper utilities for groupInvitationResponse operations.
/** @param {Record<string, any> & { get?: Function }} invitation */
function asInvitationResponse(invitation) {
  // Accept either Sequelize model instances or plain rows from raw queries.
  const row = invitation.get ? invitation.get({ plain: true }) : invitation;

  /** @type {Record<string, any>} */
  const out = {
    id: Number(row.id),
    group_id: Number(row.group_id),
    inviter_user_id: Number(row.inviter_user_id),
    invitee_user_id: Number(row.invitee_user_id),
    status: row.status,
    responded_at: row.responded_at ?? null,
    note: row.note ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };

  if (row.inviter) {
    out.inviter = {
      id: Number(row.inviter.id),
      email: row.inviter.email,
      display_name: row.inviter.display_name ?? null,
    };
  }

  if (row.invitee) {
    out.invitee = {
      id: Number(row.invitee.id),
      email: row.invitee.email,
      display_name: row.invitee.display_name ?? null,
    };
  }

  const groupLite = row.group ?? row.Group;
  if (
    groupLite &&
    typeof groupLite === "object" &&
    groupLite.id !== undefined &&
    groupLite.name !== undefined
  ) {
    out.group = {
      id: Number(groupLite.id),
      name: groupLite.name,
      status: groupLite.status ?? null,
    };
  }

  return out;
}

module.exports = { asInvitationResponse };
