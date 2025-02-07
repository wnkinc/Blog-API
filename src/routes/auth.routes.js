const express = require("express");
const {
  handleCallback,
  loginGuest,
  logout,
  refreshToken,
} = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

// Routes
router.get("/callback", handleCallback); // Handle Cognito Hosted UI callback
router.get("/guest", loginGuest);
router.get("/verify-token", verifyToken, (req, res) => {
  // Respond with a success message and the user's details
  res.json({
    success: true,
    message: "Token is valid",
    user: req.user, // Includes decoded token details
  });
});
// router.post("/logout", logout); // Logout from Cognito
// router.post("/refresh-token", refreshToken); // Refresh access token using the refresh token

module.exports = router;
