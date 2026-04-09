const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { getMatches } = require("../controllers/matchesController");

const router = express.Router();

router.get("/", authenticate, getMatches);

module.exports = router;
