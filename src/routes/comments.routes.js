// routes/comments.routes.js
const express = require("express");
const {
  getCommentsByPostId,
  postComment,
  deleteComment,
  updateComment,
} = require("../controllers/comments.controller");

const router = express.Router();

router.post("/:slug", postComment);
router.get("/:postId", getCommentsByPostId);
router.put("/:id", updateComment);
router.delete("/:id", deleteComment);

module.exports = router;
