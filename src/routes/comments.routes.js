// routes/comments.routes.js
const express = require("express");
const {
  getCommentsByPostId,
  addComment,
  deleteComment,
} = require("../controllers/comments.controller");

const router = express.Router();

router.post("/", addComment);
router.get("/:postId", getCommentsByPostId);
router.delete("/:id", deleteComment);

module.exports = router;
