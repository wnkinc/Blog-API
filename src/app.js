// app.js
require("dotenv").config();
const express = require("express");
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(
    `Request to ${req.method} ${req.url} at ${new Date().toISOString()}`
  );
  next();
});

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

// test
const verifyToken = require("./middleware/auth.middleware");
app.get("/protected-route", verifyToken, (req, res) => {
  res.status(200).json({ message: "Access granted.", user: req.user });
});

/**
 * -------------- Error handling middleware ----------------
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

/**
 * -------------- Prisma ----------------
 */
const prisma = require("./prisma");

process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

/**
 * -------------- Server ----------------
 */
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Express app - listening on port ${PORT}!`);
});
