// controllers/comments.controller.js
const prisma = require("../prisma");

/**
 * -------------- GET comments/:postId ----------------
 */
const getCommentsByPostId = async (req, res) => {
  const { postId } = req.params;
  const page = parseInt(req.query.page, 10) || 1; // Default to page 1
  const pageSize = parseInt(req.query.pageSize, 10) || 10; // Default to 10 comments per page

  try {
    if (!postId) {
      return res.status(400).json({ error: "Post ID is required." });
    }

    // Calculate the number of comments to skip
    const skip = (page - 1) * pageSize;

    // Fetch comments for the specified post with pagination
    const comments = await prisma.comment.findMany({
      where: { postId: parseInt(postId, 10), parentId: null }, // Only fetch top-level comments
      skip,
      take: pageSize,
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
      orderBy: {
        createdAt: "asc", // Order by creation time
      },
    });

    // Count total top-level comments for pagination metadata
    const totalComments = await prisma.comment.count({
      where: { postId: parseInt(postId, 10), parentId: null },
    });

    res.status(200).json({
      comments,
      meta: {
        totalComments,
        currentPage: page,
        pageSize,
        totalPages: Math.ceil(totalComments / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching comments." });
  }
};

/**
 * -------------- POST comment ----------------
 */
const addComment = async (req, res) => {
  const { content, postId, parentId, userId } = req.body;

  try {
    if (!content || !postId || !userId) {
      return res
        .status(400)
        .json({ error: "Content, postId, and userId are required." });
    }

    // Ensure parentId exists if provided (for replies)
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment) {
        return res
          .status(400)
          .json({ error: "Parent comment does not exist." });
      }
    }

    // Create the comment
    const newComment = await prisma.comment.create({
      data: {
        content,
        postId: parseInt(postId, 10),
        parentId: parentId ? parseInt(parentId, 10) : null,
        userId: parseInt(userId, 10),
      },
    });

    res
      .status(201)
      .json({ message: "Comment added successfully.", comment: newComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res
      .status(500)
      .json({ error: "An error occurred while adding the comment." });
  }
};

/**
 * -------------- DELETE comment ----------------
 */
const deleteComment = async (req, res) => {
  const { id } = req.params;

  try {
    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    await prisma.comment.delete({ where: { id: parseInt(id, 10) } });

    res.status(200).json({ message: "Comment deleted successfully." });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the comment." });
  }
};

/**
 * -------------- UPDATE comment ----------------
 */
const updateComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    if (!content) {
      return res.status(400).json({ error: "Content is required." });
    }

    // Check if the comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(id, 10) },
      data: { content },
    });

    res.status(200).json({
      message: "Comment updated successfully.",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the comment." });
  }
};

module.exports = {
  getCommentsByPostId,
  addComment,
  deleteComment,
  updateComment,
};
