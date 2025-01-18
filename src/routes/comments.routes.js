// routes/comments.routes.js
const express = require("express");
const { getCommentsByPostId } = require("../controllers/comments.controller");
const router = express.Router();

router.post("/" /* Add comment or reply */);
router.get("/:postId", getCommentsByPostId);
router.delete("/:id" /* Delete a comment */);

module.exports = router;
