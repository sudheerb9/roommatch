// Registers matches HTTP routes and applies route-level middleware.
const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { getMatches } = require("../controllers/matchesController");

const router = express.Router();

// Authenticated user id is sourced from bearer token middleware.
router.get("/", authenticate, getMatches);

module.exports = router;
