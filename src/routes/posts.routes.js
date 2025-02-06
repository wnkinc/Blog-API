const express = require("express");
const {
  getAllPosts,
  getPostBySlug,
  createPost,
  uploadImage,
} = require("../controllers/posts.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const upload = require("../middleware/multer.middleware");

const router = express.Router();

router.get("/", getAllPosts);
router.get("/:slug", getPostBySlug);
router.post("/", verifyToken, createPost);
router.post("/upload", verifyToken, upload.single("image"), uploadImage);

module.exports = router;
