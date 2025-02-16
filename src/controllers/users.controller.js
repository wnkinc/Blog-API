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
 * -------------- GET user profile ----------------
 */
const getUserProfile = async (req, res) => {
  const userSub = req.params.sub; // Assuming the Cognito sub is passed as the ID in the request

  try {
    // Fetch user using the sub field, including posts with their author and comments
    const user = await prisma.user.findUnique({
      where: { sub: userSub },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
          include: {
            author: true,
            comments: true, // Include comments for each post
          },
        },
      },
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
 * -------------- UPDATE user bio ----------------
 */
const updateUserBio = async (req, res) => {
  try {
    const userSub = req.params.sub; // Get the Cognito sub from the request URL
    const { bio } = req.body; // Get the new bio from the request body

    // Validate bio input
    if (!bio || typeof bio !== "string") {
      return res.status(400).json({ error: "Bio must be a valid string." });
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { sub: userSub },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Update the user's bio
    const updatedUser = await prisma.user.update({
      where: { sub: userSub },
      data: { bio },
    });

    return res
      .status(200)
      .json({ message: "Bio updated successfully.", user: updatedUser });
  } catch (error) {
    console.error("Error updating user bio:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = {
  createUser,
  getUserProfile,
  updateUserBio,
};
