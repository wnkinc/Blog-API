// controllers/posts.controller.js
const prisma = require("../prisma");
const slugify = require("slugify");
const sanitizeHtml = require("sanitize-html");
require("dotenv").config();

/**
 * -------------- GET posts ----------------
 */
const getAllPosts = async (req, res) => {
  try {
    // Get pagination parameters from the query string
    const page = parseInt(req.query.page, 10) || 1; // Default to page 1
    const pageSize = parseInt(req.query.pageSize, 10) || 10; // Default to 10 posts per page

    // Calculate the number of posts to skip
    const skip = (page - 1) * pageSize;

    // Fetch posts with pagination
    const posts = await prisma.post.findMany({
      skip,
      take: pageSize,
      include: {
        author: {
          select: { id: true, username: true },
        },
        comments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Count total posts for pagination metadata
    const totalPosts = await prisma.post.count();

    res.status(200).json({
      posts,
      meta: {
        totalPosts,
        currentPage: page,
        pageSize,
        totalPages: Math.ceil(totalPosts / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "An error occurred while fetching posts." });
  }
};

/**
 * -------------- GET post/:slug ----------------
 */
const getPostBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    // Find the post by slug
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, username: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, username: true },
            },
            replies: {
              include: {
                user: {
                  select: { id: true, username: true },
                },
              },
            },
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    res.status(200).json({ post });
  } catch (error) {
    console.error("Error fetching post by slug:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the post." });
  }
};

/**
 * -------------- CREATE post ----------------
 */
async function createPost(req, res) {
  console.log("🚀 createPost route was hit!");
  try {
    const { title, content, status, sub, coverImage } = req.body;

    if (!title || !content || !sub) {
      return res
        .status(400)
        .json({ error: "Title, content, and sub are required." });
    }

    // Look up the user by AWS Cognito `sub`
    const user = await prisma.user.findUnique({
      where: { sub },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Generate a unique slug from the title
    let slug = slugify(title, { lower: true, strict: true });

    // Ensure slug is unique by appending a number if needed
    let existingPost = await prisma.post.findUnique({ where: { slug } });
    let counter = 1;
    while (existingPost) {
      slug = `${slug}-${counter}`;
      existingPost = await prisma.post.findUnique({ where: { slug } });
      counter++;
    }

    const cleanContent = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.filter(
        (tag) => tag !== "script" && tag !== "style"
      ),
      disallowedTagsMode: "discard", // Remove disallowed tags completely
    });

    // Store post in PostgreSQL using Prisma
    const newPost = await prisma.post.create({
      data: {
        title,
        slug,
        content: cleanContent,
        published: status === "published",
        coverImage: coverImage || null, // Save cover image URL (if provided)
        authorId: user.id,
      },
    });

    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * -------------- UPDATE post ----------------
 */
const updatePost = async (req, res) => {};

/**
 * -------------- DELETE post ----------------
 */
const deletePost = async (req, res) => {};

/**
 * -------------- UPLOAD image ----------------
 */
async function uploadImage(req, res) {
  try {
    console.log("HITTTTTTTTER");
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    // Construct the URL for the uploaded image
    const imageUrl = `${process.env.BLOG_API_BASE_URL}/uploads/${req.file.filename}`;

    // Return the image URL to the frontend
    res.json({ imageUrl });
  } catch (error) {
    console.error("Image upload error:", error.message);
    res.status(500).json({ error: "Failed to upload image." });
  }
}

module.exports = {
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  uploadImage,
};
