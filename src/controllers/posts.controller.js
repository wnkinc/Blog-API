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
    const { title, content, status, sub } = req.body;

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

    // Sanitize content before saving
    const cleanContent = sanitizeHtml(content, {
      allowedTags: [
        "p",
        "h1",
        "h2",
        "h3",
        "b",
        "i",
        "u",
        "a",
        "img",
        "ul",
        "li",
        "blockquote",
        "code",
      ],
      allowedAttributes: {
        a: ["href", "target"],
        img: ["src", "alt"],
      },
    });

    // Store post in PostgreSQL using Prisma
    const newPost = await prisma.post.create({
      data: {
        title,
        slug,
        content: cleanContent,
        published: status === "published",
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
const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, slug, content, published } = req.body;

  try {
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Determine final slug
    let finalSlug = slug || existingPost.slug;
    if (title && !slug) {
      finalSlug = slugify(title, { lower: true, strict: true });

      // Ensure the slug is unique
      let slugExists = await prisma.post.findUnique({
        where: { slug: finalSlug },
      });
      let counter = 1;
      while (slugExists) {
        finalSlug = `${slugify(title, {
          lower: true,
          strict: true,
        })}-${counter}`;
        slugExists = await prisma.post.findUnique({
          where: { slug: finalSlug },
        });
        counter++;
      }
    }

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(id, 10) },
      data: {
        title: title || existingPost.title,
        slug: finalSlug,
        content: content || existingPost.content,
        published: published !== undefined ? published : existingPost.published,
      },
    });

    res
      .status(200)
      .json({ message: "Post updated successfully.", post: updatedPost });
  } catch (error) {
    console.error("Error updating post:", error);
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "A post with this slug already exists." });
    }
    res
      .status(500)
      .json({ error: "An error occurred while updating the post." });
  }
};

/**
 * -------------- DELETE post ----------------
 */
const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found." });
    }

    await prisma.post.delete({ where: { id: parseInt(id, 10) } });

    res.status(200).json({ message: "Post deleted successfully." });
  } catch (error) {
    console.error("Error deleting post:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the post." });
  }
};

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
