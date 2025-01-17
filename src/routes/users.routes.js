const express = require("express");
const router = express.Router();

router.get("/:id" /* Fetch user profile */);
router.put("/:id" /* Update user profile */);
router.delete("/:id" /* Delete user */);

module.exports = router;
