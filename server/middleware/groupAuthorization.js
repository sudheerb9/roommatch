const { assertCanAccessGroup } = require("../utils/groupAccess");

async function authorizeGroupAccess(req, res, next) {
  try {
    const access = await assertCanAccessGroup(req.params.groupId, req.user);
    if (!access.ok) {
      return res.status(access.status).json(access.body);
    }

    req.group = access.group;
    req.groupMembership = access.membership;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { authorizeGroupAccess };
