const express = require("express");
const cors = require("cors");
const config = require("./config");
const connectDB = require("./config/db");
const { autoSeed } = require("./services/seedService");

// Route imports
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/students");
const reviewRoutes = require("./routes/reviews");
const summaryRoutes = require("./routes/summary");
const applicationRoutes = require("./routes/applications");

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reviews", summaryRoutes);
app.use("/api/applications", applicationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// Start server
const start = async () => {
  await connectDB();

  // Auto-seed: if DB is empty, populate from cleanedStudents.json
  await autoSeed();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

start();

module.exports = app;
