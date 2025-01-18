// test/seed.js

const prisma = require("../prisma");

// Seed mock users into the database
const seedMockUsers = async () => {
  try {
    await prisma.user.createMany({
      data: [
        {
          email: "john@example.com",
          username: "JohnDoe",
          password: "hashed_password_123", // Replace with hashed password if needed
        },
        {
          email: "jane@example.com",
          username: "JaneSmith",
          password: "hashed_password_456", // Replace with hashed password if needed
        },
      ],
      skipDuplicates: true, // Prevent duplicates if script is run multiple times
    });
    console.log("Mock users seeded successfully.");
  } catch (error) {
    console.error("Error seeding mock users:", error);
    throw new Error("Failed to seed mock users.");
  }
};

seedMockUsers();

module.exports = {
  seedMockUsers,
};
