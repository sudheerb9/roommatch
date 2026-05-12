// Registers profile HTTP routes and applies route-level middleware.
const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
} = require("../controllers/profileController");

const router = express.Router();

// Private profile endpoints for the authenticated account.
router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, updateMyProfile);
// Public-ish read endpoint still requires auth and active target account.
router.get("/:userId", authenticate, getUserProfile);

module.exports = router;

