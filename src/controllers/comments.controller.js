// controllers/comments.controller.js
const prisma = require("../prisma");
const jwt = require("jsonwebtoken");

/**
 * -------------- POST comment ----------------
 */
const postComment = async (req, res) => {
  const { slug } = req.params;
  const { content } = req.body;

  try {
    // Find the post by slug to get its ID
    const post = await prisma.post.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Create a new comment (without a user)
    const newComment = await prisma.comment.create({
      data: {
        content,
        postId: post.id,
      },
    });

    res.status(201).json({ comment: newComment });
  } catch (error) {
    console.error("Error posting comment:", error);
    res
      .status(500)
      .json({ error: "An error occurred while posting the comment." });
  }
};

/**
 * -------------- POST reply ----------------
 */
const postReply = async (req, res) => {
  const { slug } = req.params;
  const { content, commentId } = req.body;

  try {
    // Find the post by slug to ensure it exists
    const post = await prisma.post.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Find the parent comment to ensure it exists
    const parentComment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId, 10) },
      select: { id: true },
    });

    if (!parentComment) {
      return res.status(404).json({ error: "Parent comment not found." });
    }

    // Create a new reply linked to the parent comment
    const newReply = await prisma.comment.create({
      data: {
        content,
        postId: post.id, // Link to the post
        parentId: parentComment.id, // Link to the parent comment
      },
    });

    res.status(201).json({ reply: newReply });
  } catch (error) {
    console.error("Error posting reply:", error);
    res
      .status(500)
      .json({ error: "An error occurred while posting the reply." });
  }
};

/**
 * -------------- POST comment for user ----------------
 */
const postCommentUser = async (req, res) => {
  const { slug } = req.params;
  const { content, idToken } = req.body;

  try {
    // Decode the ID Token to get the Cognito sub (unique user identifier)
    let sub = null;
    if (idToken) {
      const decoded = jwt.decode(idToken);
      sub = decoded?.sub;
    }

    if (!sub) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Missing or invalid ID Token." });
    }

    // Find user by Cognito sub
    const user = await prisma.user.findUnique({
      where: { sub },
      select: { id: true }, // Only fetch the user ID
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Find post by slug to get postId
    const post = await prisma.post.findUnique({
      where: { slug },
      select: { id: true }, // Only fetch the post ID
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Create the comment with the correct userId and postId
    const newComment = await prisma.comment.create({
      data: {
        content,
        userId: user.id, // Assign correct user ID
        postId: post.id, // Assign correct post ID
      },
    });

    res.json(newComment);
  } catch (error) {
    console.error("Error saving comment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * -------------- POST reply for user ----------------
 */
const postReplyUser = async (req, res) => {
  const { slug } = req.params;
  const { content, commentId, idToken } = req.body;

  try {
    // Decode the ID Token to get the Cognito `sub`
    let sub = null;
    if (idToken) {
      const decoded = jwt.decode(idToken);
      sub = decoded?.sub;
    }

    if (!sub) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Missing or invalid ID Token." });
    }

    // Find user by Cognito sub
    const user = await prisma.user.findUnique({
      where: { sub },
      select: { id: true }, // Fetch user ID only
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Find the post by slug to get postId
    const post = await prisma.post.findUnique({
      where: { slug },
      select: { id: true }, // Fetch post ID only
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Find the parent comment
    const parentComment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
      select: { id: true }, // Fetch comment ID only
    });

    if (!parentComment) {
      return res.status(404).json({ error: "Parent comment not found." });
    }

    // Create the reply in the database
    const newReply = await prisma.comment.create({
      data: {
        content,
        userId: user.id, // Assign correct user ID
        postId: post.id, // Assign correct post ID
        parentId: parentComment.id, // Set parent comment ID
      },
    });

    res.json(newReply);
  } catch (error) {
    console.error("Error saving reply:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  postComment,
  postReply,
  postCommentUser,
  postReplyUser,
};
