const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
} = require("../controllers/profileController");

const router = express.Router();

router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, updateMyProfile);
router.get("/:userId", authenticate, getUserProfile);

module.exports = router;

