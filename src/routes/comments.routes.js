// routes/comments.routes.js
const express = require("express");
const {
  postComment,
  postReply,
  postCommentUser,
} = require("../controllers/comments.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/:slug", postComment);
router.post("/:slug/reply", postReply);

router.post("/:slug/user", verifyToken, postCommentUser);
router.post("/:slug/reply/user", verifyToken, postReply);

module.exports = router;
