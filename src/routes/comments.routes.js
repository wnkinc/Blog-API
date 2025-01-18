// routes/comments.routes.js
const express = require("express");
const router = express.Router();

router.post("/" /* Add comment or reply */);
router.get("/:postId" /* Fetch comments for a post */);
router.delete("/:id" /* Delete a comment */);

module.exports = router;
