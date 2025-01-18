// controllers/users.controller.js
const prisma = require("../prisma");

// Get user profile
const getUserProfile = async (req, res) => {
  const userId = req.params.id;

  try {
    // Fetch user directly from the database using Prisma
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) }, // Ensure userId is parsed as an integer
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

module.exports = {
  getUserProfile,
};
