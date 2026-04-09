const express = require("express");
const router = express.Router();

// POST /auth/login
router.post("/login", (req, res) => {
  // TODO: Authenticate user
  // Example: req.body = { email, password }
  // On success: req.session.user = { id, email }
  res.json({ message: "Login endpoint (not implemented)" });
});

// GET /auth/callback
router.get("/callback", (req, res) => {
  // TODO: Handle OAuth or external provider callback
  res.json({ message: "Callback endpoint (not implemented)" });
});

// GET /auth/me
router.get("/me", (req, res) => {
  // TODO: Return current session user info
  // Example: res.json(req.session.user || null)
  res.json({ message: "Me endpoint (not implemented)" });
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  // TODO: Destroy session
  // Example: req.session.destroy()
  res.json({ message: "Logout endpoint (not implemented)" });
});

module.exports = router;
