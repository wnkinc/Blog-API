const express = require("express");
const {
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  uploadImage,
} = require("../controllers/posts.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const upload = require("../middleware/multer.middleware");

const router = express.Router();

router.get("/", getAllPosts);
router.get("/:slug", getPostBySlug);
router.post("/", verifyToken, createPost);
router.post("/upload", verifyToken, upload.single("image"), uploadImage);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);

module.exports = router;
