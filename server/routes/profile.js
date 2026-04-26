const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const {
  getMyProfile,
  updateMyProfile,
} = require("../controllers/profileController");

const router = express.Router();

router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, updateMyProfile);

module.exports = router;

