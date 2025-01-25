// controllers/users.controller.js
const prisma = require("../prisma");

/**
 * -------------- Check_If_Exists/Create User ----------------
 */
async function createUser(req, res) {
  try {
    const { sub, email, username } = req.body;

    // Validate required fields
    if (!sub || !email || !username) {
      return res
        .status(400)
        .json({ error: "Missing required user information." });
    }

    // Check if the user already exists in the database using cognitoId
    const existingUser = await prisma.user.findUnique({
      where: { sub }, // Use cognitoId to check for existence
    });

    if (existingUser) {
      return res
        .status(200) // Returning 200 because the operation is not an error
        .json({ message: "User already exists.", user: existingUser });
    }

    // Create a new user
    const user = await prisma.user.create({
      data: {
        sub, // Use 'sub' as 'cognitoId'
        email,
        username,
      },
    });

    return res
      .status(201)
      .json({ message: "User created successfully.", user });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

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
  const userSub = req.params.sub; // Assuming the Cognito sub is passed as the ID in the request

  try {
    // Fetch user using the sub field in the database
    const user = await prisma.user.findUnique({
      where: { sub: userSub }, // Query by sub instead of id
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.status(500).json({
      error: "An error occurred while fetching the user profile.",
    });
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
  createUser,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  getUserPosts,
};
