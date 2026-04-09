function parsePositiveInt(value, defaultValue) {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
}

function getPagination(query, defaults = {}) {
  const page = parsePositiveInt(query.page, defaults.page || 1);
  const limit = Math.min(
    parsePositiveInt(query.limit, defaults.limit || 20),
    defaults.maxLimit || 50,
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildPaginationMeta({ page, limit, count }) {
  return {
    page,
    limit,
    count,
    hasMore: count === limit,
  };
}

module.exports = {
  getPagination,
  buildPaginationMeta,
};
