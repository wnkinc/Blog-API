// controllers/posts.controller.js
const prisma = require("../prisma");

// Fetch all posts with pagination
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

// Fetch a single post by slug
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

module.exports = {
  getAllPosts,
  getPostBySlug,
};
