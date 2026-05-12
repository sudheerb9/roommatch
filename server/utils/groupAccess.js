// Shared helper utilities for groupAccess operations.
const { Group, GroupMember } = require("../models");

/**
 * Loads the group and ensures `user` is the owner or a row in `group_members`.
 * @param {string} groupIdParam - Numeric string group id from route params.
 * @param {{ id: bigint|number }} user - Authenticated user with `id`.
 */
async function assertCanAccessGroup(groupIdParam, user) {
  if (typeof groupIdParam !== "string" || !/^\d+$/.test(groupIdParam)) {
    return { ok: false, status: 400, body: { error: "Invalid group id" } };
  }

  const group = await Group.findByPk(groupIdParam);
  if (!group) {
    return { ok: false, status: 404, body: { error: "Group not found" } };
  }

  const ownerId =
    typeof group.owner_user_id === "bigint"
      ? group.owner_user_id.toString()
      : String(group.owner_user_id);
  const userId = typeof user.id === "bigint" ? user.id.toString() : String(user.id);
  if (ownerId === userId) {
    // Owner has implicit access even without a separate membership lookup.
    return { ok: true, group, membership: null };
  }

  const membership = await GroupMember.findOne({
    where: { group_id: group.id, user_id: user.id },
  });
  if (!membership) {
    return {
      ok: false,
      status: 403,
      body: { error: "You do not belong to this group" },
    };
  }

  return { ok: true, group, membership };
}

module.exports = { assertCanAccessGroup };
