// routes/users.routes.js
const express = require("express");
const {
  getUserProfile,
  updateUserProfile,
  deleteUser,
  getUserPosts,
  createUser,
} = require("../controllers/users.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", verifyToken, createUser);
router.get("/:id", getUserProfile);

router.get("/:id/posts", getUserPosts);
router.put("/:id", updateUserProfile);
router.delete("/:id", deleteUser);

module.exports = router;

// Route	---- User Frontend	---- Viewer Frontend
// GET /:id	---- View own profile or other users’ profiles.	---- View author profile from a blog post.
// PUT /:id	---- Edit logged-in user's profile.	---- Not applicable.
// DELETE /:id	---- Delete logged-in user's account.	---- Not applicable.
