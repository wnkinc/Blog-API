// routes/users.routes.js
const express = require("express");
const {
  createUser,
  getUserProfile,
  updateUserBio,
  updateUserPic,
} = require("../controllers/users.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", verifyToken, createUser);
router.get("/:sub", getUserProfile);
router.post("/:sub/bio", verifyToken, updateUserBio);
router.post("/:sub/pic", verifyToken, updateUserPic);

module.exports = router;

// Route	---- User Frontend	---- Viewer Frontend
// GET /:id	---- View own profile or other users’ profiles.	---- View author profile from a blog post.
// PUT /:id	---- Edit logged-in user's profile.	---- Not applicable.
// DELETE /:id	---- Delete logged-in user's account.	---- Not applicable.
