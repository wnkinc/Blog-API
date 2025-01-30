const express = require("express");
const {
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} = require("../controllers/posts.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", getAllPosts);
router.get("/:slug", getPostBySlug);
router.post("/", verifyToken, createPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);

module.exports = router;
