// controllers/users.controller.js
const prisma = require("../prisma");

/**
 * -------------- GET user posts ----------------
 */
const getUserPosts = async (req, res) => {
  try {
    const userId = parseInt(req.params.id); // Get user ID from route parameter
    const { published, search } = req.query;

    if (isNaN(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    // Build the filter object dynamically
    const filters = { authorId: userId };
    if (published !== undefined) filters.published = published === "true";
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch posts from the database
    const posts = await prisma.post.findMany({
      where: filters,
      orderBy: { createdAt: "desc" }, // Sort by newest posts first
      include: {
        author: true, // Include author details
        comments: true, // Optionally include comments
      },
    });

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch user posts" });
  }
};

/**
 * -------------- GET user profile ----------------
 */
const getUserProfile = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the user profile." });
  }
};

/**
 * -------------- PUT user ----------------
 */
const updateUserProfile = async (req, res) => {
  const userId = req.params.id;
  const { email, username, password } = req.body;

  try {
    // Update user in the database using Prisma
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId, 10) }, // Ensure userId is parsed as an integer
      data: {
        email,
        username,
        password, // Ideally, hash the password before saving
      },
    });

    res.status(200).json({
      message: "User profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found." });
    }
    res
      .status(500)
      .json({ error: "An error occurred while updating the user profile." });
  }
};

/**
 * -------------- DELETE user ----------------
 */
const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    // Delete user from the database using Prisma
    await prisma.user.delete({
      where: { id: parseInt(userId, 10) }, // Ensure userId is parsed as an integer
    });

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found." });
    }
    res
      .status(500)
      .json({ error: "An error occurred while deleting the user." });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUser,
  getUserPosts,
};
