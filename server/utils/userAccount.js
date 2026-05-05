/**
 * @param {import("sequelize").Model | { is_active?: unknown } | null | undefined} user
 * @returns {boolean}
 */
function userAccountIsActive(user) {
  if (!user) {
    return false;
  }
  const v =
    typeof user.get === "function" ? user.get("is_active") : user.is_active;
  if (v === false || v === 0) {
    return false;
  }
  return true;
}

module.exports = {
  userAccountIsActive,
};
