const express = require("express");
const {
  getAllPosts,
  getPostBySlug,
} = require("../controllers/posts.controller");
const router = express.Router();

router.get("/", getAllPosts); // Fetch all posts
router.get("/:slug", getPostBySlug); // Fetch single post by slug
router.post("/" /* Create a new post */);
router.put("/:id" /* Update a post */);
router.delete("/:id" /* Delete a post */);

module.exports = router;
