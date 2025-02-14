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
    // Fetch all posts with their reactions
    const posts = await prisma.post.findMany({
      include: {
        author: { select: { id: true, username: true } },
        comments: true,
        reactions: { select: { type: true, count: true } }, // Fetch each reaction per post
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate total reactions count across all posts (ignoring type)
    const totalReactions = await prisma.reaction.aggregate({
      _sum: { count: true },
    });

    res.status(200).json({
      posts,
      totalReactions: totalReactions._sum.count || 0, // Ensure it's 0 if no reactions exist
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
        reactions: true, // Fetch all reactions for the post
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Default reaction counts
    const defaultReactions = {
      like: 0,
      unicorn: 0,
      funny: 0,
      wow: 0,
      dislike: 0,
    };

    // Convert fetched reactions into an object with total counts
    const reactionCounts = post.reactions.reduce((acc, reaction) => {
      acc[reaction.type] = reaction.count;
      return acc;
    }, defaultReactions); // Merge with defaults

    res.status(200).json({ post, reactions: reactionCounts });
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
      allowedTags: [
        ...sanitizeHtml.defaults.allowedTags,
        "img", // explicitly add 'img'
      ],
      allowedAttributes: {
        // merge default allowed attributes with our custom ones
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ["src", "alt", "width", "height"],
      },
      disallowedTagsMode: "discard",
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
 * -------------- POST reactions BACKEND ----------------
 */
const postReactions = async (req, res) => {
  try {
    const { allSelections } = req.body;
    // allSelections could be { "123": ["like","funny"], "456":["wow"] }
    for (const pid in allSelections) {
      const types = allSelections[pid];
      for (const type of types) {
        await prisma.reaction.upsert({
          where: { postId_type: { postId: parseInt(pid), type } },
          update: { count: { increment: 1 } },
          create: { postId: parseInt(pid), type, count: 1 },
        });
      }
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in postReactions:", error);
    res.status(500).json({ error: "DB update error" });
  }
};

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
  postReactions,
  updatePost,
  deletePost,
  uploadImage,
};
