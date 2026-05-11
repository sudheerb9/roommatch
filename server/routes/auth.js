const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const { User, Session } = require("../models");
const {
  createPasswordHash,
  verifyPassword,
  createSessionToken,
  signSessionToken,
  verifySessionToken,
} = require("../utils/auth");
const { generateBearerToken } = require("../utils/authToken");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
});

async function authenticateSession(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = verifySessionToken(token);
    const sessionToken = decoded.sessionToken;
    // Session table lookup enables revocation/expiry checks server-side.
    const session = await Session.findOne({
      where: { session_token: sessionToken, is_revoked: false },
    });

    if (!session || session.expires_at < new Date()) {
      return res.status(401).json({ message: "Session expired or invalid" });
    }

    const user = await User.findByPk(session.user_id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.session = session;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid authorization token" });
  }
}

// POST /auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, display_name } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const { salt, hash } = createPasswordHash(password);
    const user = await User.create({
      email,
      display_name: display_name || email.split("@")[0],
      password_salt: salt,
      password_hash: hash,
    });

    const sessionToken = createSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await Session.create({
      user_id: user.id,
      session_token: sessionToken,
      expires_at: expiresAt,
    });

    const bearerToken = signSessionToken(sessionToken);
    return res.status(201).json({
      token: bearerToken,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
      },
      expires_at: expiresAt,
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (
      !user ||
      !user.password_hash ||
      !verifyPassword(password, user.password_salt, user.password_hash)
    ) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const sessionToken = createSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await Session.create({
      user_id: user.id,
      session_token: sessionToken,
      expires_at: expiresAt,
    });

    const bearerToken = signSessionToken(sessionToken);
    return res.json({
      token: bearerToken,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
      },
      expires_at: expiresAt,
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/callback
router.post("/callback", async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Credential is required" });
    }

    // Verify Google-issued ID token before trusting identity claims.
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleSub = payload.sub;
    const email = payload.email;
    const displayName = payload.name;

    // Find or create user
    let user = await User.findOne({
      where: { google_sub: googleSub },
    });

    if (!user) {
      // Check if email already exists (from email/password signup)
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        // Update existing user with google_sub
        await existingUser.update({ google_sub: googleSub });
        user = existingUser;
      } else {
        // Create new user
        user = await User.create({
          email,
          display_name: displayName,
          google_sub: googleSub,
        });
      }
    }

    // OAuth login path currently uses bearer token directly (no Session row).
    const bearerToken = generateBearerToken(user);

    return res.status(200).json({
      token: bearerToken,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
      },
    });
  } catch (error) {
    console.error("Callback error:", error);
    return res.status(401).json({ message: "Invalid credential" });
  }
});

// GET /auth/me
router.get("/me", authenticate, (req, res, next) => {
  try {
    const { user } = req;
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout
router.post("/logout", authenticate, (req, res, next) => {
  try {
    // JWT tokens are stateless, so logout is just a client-side operation.
    // The token will remain valid until expiry, but the client removes it from storage.
    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
