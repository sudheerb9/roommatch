const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { listHousingUnits } = require("../controllers/housingController");

const router = express.Router();

router.get("/", authenticate, listHousingUnits);

module.exports = router;
