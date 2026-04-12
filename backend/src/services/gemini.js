const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config");

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

const generateSummary = async (reviewText) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a mentorship evaluation assistant. Given the following review text about a student, generate exactly 3 concise, actionable bullet points summarizing the key feedback and next steps.

Review text:
"${reviewText}"

Respond with exactly 3 bullet points, each on a new line, starting with "- ". Keep each point under 20 words. Focus on actionable improvements.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  const bullets = response
    .split("\n")
    .filter((line) => line.trim().startsWith("-"))
    .map((line) => line.trim().replace(/^-\s*/, ""))
    .slice(0, 3);

  // Ensure exactly 3 points
  while (bullets.length < 3) {
    bullets.push("No additional feedback available.");
  }

  return bullets;
};

module.exports = { generateSummary };
