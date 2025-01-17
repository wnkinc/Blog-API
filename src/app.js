// app.js
require("dotenv").config();
const express = require("express");
const app = express();

/**
 * -------------- ROUTES ----------------
 */
const authRoutes = require("./routes/auth.routes");
const postsRoutes = require("./routes/posts.routes");
const commentsRoutes = require("./routes/comments.routes");
const usersRoutes = require("./routes/users.routes");

app.use("/auth", authRoutes);
app.use("/posts", postsRoutes);
app.use("/comments", commentsRoutes);
app.use("/users", usersRoutes);

/**
 * -------------- Error handling middleware ----------------
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

/**
 * -------------- SERVER ----------------
 */
// Gracefully shutdown server and disconnect from Prisma
process.on("SIGINT", async () => {
  console.log("Server is shutting down...");
  await prisma.$disconnect(); // Disconnect Prisma Client
  process.exit(0); // Exit the process
});
process.on("SIGTERM", async () => {
  console.log("Server is shutting down...");
  await prisma.$disconnect(); // Disconnect Prisma Client
  process.exit(0); // Exit the process
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Express app - listening on port ${PORT}!`);
});
