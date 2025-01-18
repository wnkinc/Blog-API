// routes/comments.routes.js
const express = require("express");
const {
  getCommentsByPostId,
  addComment,
} = require("../controllers/comments.controller");
const router = express.Router();

router.post("/", addComment);
router.get("/:postId", getCommentsByPostId);
router.delete("/:id" /* Delete a comment */);

module.exports = router;
