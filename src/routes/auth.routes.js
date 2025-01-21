const express = require("express");
const {
  handleCallback,
  logout,
  refreshToken,
} = require("../controllers/auth.controller");

const router = express.Router();

// Routes
router.get("/callback", handleCallback); // Handle Cognito Hosted UI callback
// router.post("/logout", logout); // Logout from Cognito
// router.post("/refresh-token", refreshToken); // Refresh access token using the refresh token

module.exports = router;
