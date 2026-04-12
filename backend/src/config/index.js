const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/mentorship",
  jwtSecret: process.env.JWT_SECRET || "fallback_secret",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
};
