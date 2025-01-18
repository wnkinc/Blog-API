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

// Seed mock posts into the database
const seedMockPosts = async () => {
  try {
    await prisma.post.createMany({
      data: [
        {
          title: "First Post",
          slug: "first-post",
          content: "This is the content of the first post.",
          published: true,
          authorId: 5, // Assuming the author ID exists in the database
        },
        {
          title: "Second Post",
          slug: "second-post",
          content: "This is the content of the second post.",
          published: false,
          authorId: 6, // Assuming the author ID exists in the database
        },
      ],
      skipDuplicates: true, // Prevent duplicates if script is run multiple times
    });
    console.log("Mock posts seeded successfully.");
  } catch (error) {
    console.error("Error seeding mock posts:", error);
    throw new Error("Failed to seed mock posts.");
  }
};

const main = async () => {
  // await seedMockUsers();
  await seedMockPosts();
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

module.exports = {
  seedMockUsers,
  seedMockPosts,
};
