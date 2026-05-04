const { getPagination, buildPaginationMeta } = require("../utils/pagination");
const {
  getMatchedUsersForUser,
  isMatchingEligible,
} = require("../services/matchingService");

async function getMatches(req, res, next) {
  try {
    const pagination = getPagination(req.query, { limit: 20, maxLimit: 50 });
    const eligible = await isMatchingEligible(req.user.id);
    const items = eligible
      ? await getMatchedUsersForUser(req.user.id, pagination)
      : [];

    return res.json({
      items,
      meta: {
        ...buildPaginationMeta({
          page: pagination.page,
          limit: pagination.limit,
          count: items.length,
        }),
        matching_eligible: eligible,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMatches,
};
