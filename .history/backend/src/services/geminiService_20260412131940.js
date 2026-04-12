const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateSummary = async (reviewText) => {
  if (!reviewText || !reviewText.trim()) {
    throw new Error("Review text is empty");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Convert the following mentor review into exactly 3 short actionable bullet points for a student. Keep it concise and clear.\n\n"${reviewText}"`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  const bullets = response
    .split("\n")
    .filter((line) => line.trim().startsWith("-") || line.trim().startsWith("•"))
    .map((line) => line.trim().replace(/^[-•]\s*/, ""))
    .slice(0, 3);

  while (bullets.length < 3) {
    bullets.push("No additional feedback available.");
  }

  return bullets;
};

module.exports = { generateSummary };
