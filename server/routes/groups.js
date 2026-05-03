const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const {
  getGroupMatches,
  assignGroupHousing,
  getGroupAssignment,
} = require("../controllers/groupsController");

const router = express.Router();

router.get("/:groupId/matches", authenticate, getGroupMatches);
router.post("/:groupId/assign", authenticate, assignGroupHousing);
router.get("/:groupId/assignment", authenticate, getGroupAssignment);

module.exports = router;
