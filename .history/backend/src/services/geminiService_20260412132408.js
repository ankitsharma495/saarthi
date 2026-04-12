const { GoogleGenerativeAI } = require("@google/generative-ai");

// ─── Initialize Gemini Client ───────────────────────────────────
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not set. AI features will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });

// ─── Reusable: generate text from any prompt ────────────────────
const generateText = async (prompt) => {
  if (!prompt || !prompt.trim()) {
    throw new Error("Prompt cannot be empty");
  }

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const result = await model.generateContent(prompt);
  return result.response.text();
};

// ─── Domain: review → 3 bullet points ───────────────────────────
const generateSummary = async (reviewText) => {
  if (!reviewText || !reviewText.trim()) {
    throw new Error("Review text is empty");
  }

  const prompt = `
Convert the following mentor review into exactly 3 short actionable bullet points for a student.
Keep it concise, clear, and practical.

Review:
${reviewText}
`;

  const raw = await generateText(prompt);

  const bullets = raw
    .split("\n")
    .filter((line) => line.trim().startsWith("-") || line.trim().startsWith("•"))
    .map((line) => line.trim().replace(/^[-•]\s*/, ""))
    .slice(0, 3);

  while (bullets.length < 3) {
    bullets.push("No additional feedback available.");
  }

  return bullets;
};

module.exports = { generateText, generateSummary };
