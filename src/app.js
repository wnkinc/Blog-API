// app.js
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const serverless = require("serverless-http");

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add cookie-parser middleware
app.use(cookieParser()); // Parses cookies into req.cookies

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

/**
 * -------------- logging middleware ----------------
 */
// app.use((req, res, next) => {
//   const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
//   const origin =
//     req.headers.origin ||
//     "No Origin (likely same-origin or server-side request)";
//   const userAgent = req.headers["user-agent"] || "Unknown";

//   console.log(
//     `Request to ${req.method} ${fullUrl} at ${new Date().toISOString()}`
//   );
//   console.log("Request Origin:", origin);
//   console.log("User-Agent:", userAgent);
//   console.log("Headers:", req.headers);
//   console.log("Cookies:", req.cookies);

//   next();
// });

/**
 * -------------- ROUTES ----------------
 */
app.get("/", (req, res) => {
  console.log("Received request at /");
  res.json({ message: "Hello from Express on AWS Lambda!" });
});

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
  if (err.message === "Not allowed by CORS") {
    console.error("CORS Error:", err.message);
    return res.status(403).json({ error: "CORS error: Origin not allowed" });
  }

  console.error("Error:", err.stack || err.message);
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
module.exports.handler = serverless(app);
