// Handles housing domain request workflows for API responses.
const { Op } = require("sequelize");
const { HousingUnit } = require("../models");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

async function listHousingUnits(req, res, next) {
  try {
    const where = {};
    if (req.query.available === "true") {
      where.is_available = true;
    } else if (req.query.available === "false") {
      where.is_available = false;
    }

    const pagination = getPagination(req.query, { limit: 50, maxLimit: 100 });
    const [items, count] = await Promise.all([
      HousingUnit.findAll({
        where,
        order: [
          ["building", "ASC"],
          ["unit_code", "ASC"],
        ],
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      HousingUnit.count({ where }),
    ]);

    return res.json({
      items,
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        count: items.length,
      }),
      total: count,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listHousingUnits };
