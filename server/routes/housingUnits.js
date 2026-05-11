const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { listHousingUnits } = require("../controllers/housingController");

const router = express.Router();

// Listing remains auth-gated even for read-only housing inventory.
router.get("/", authenticate, listHousingUnits);

module.exports = router;
