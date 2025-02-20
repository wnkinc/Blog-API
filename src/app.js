// src/app.js
const express = require("express");
const serverless = require("serverless-http");

const app = express();

// Minimal test route
app.get("/", (req, res) => {
  console.log("Received request at /");
  res.json({ message: "Hello from Minimal Express on AWS Lambda" });
});

module.exports.handler = serverless(app);
