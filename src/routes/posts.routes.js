const express = require("express");
const {
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} = require("../controllers/posts.controller");
const router = express.Router();

router.get("/", getAllPosts);
router.get("/:slug", getPostBySlug);
router.post("/", createPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);

module.exports = router;
