const express = require("express");
const { signup } = require("../controllers/auth.controller");
const router = express.Router();

router.post("/login" /* Controller Logic */);

router.post("/signup", signup);

router.post("/logout" /* Controller Logic */);

module.exports = router;
