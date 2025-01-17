const express = require("express");
const router = express.Router();

router.get("/" /* Fetch all posts */);
router.get("/:slug" /* Fetch single post by slug */);
router.post("/" /* Create a new post */);
router.put("/:id" /* Update a post */);
router.delete("/:id" /* Delete a post */);

module.exports = router;
