const express = require("express");
const Review = require("../models/Review");
const { authenticate, authorize } = require("../middleware/auth");
const { generateSummary } = require("../services/gemini");

const router = express.Router();

// POST /api/reviews/:id/summary — mentor generates AI summary
router.post(
  "/:id/summary",
  authenticate,
  authorize("mentor"),
  async (req, res) => {
    try {
      const review = await Review.findById(req.params.id);

      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      const summary = await generateSummary(review.reviewText);

      review.summary = summary;
      await review.save();

      res.json({ summary });
    } catch (error) {
      console.error("AI Summary error:", error.message);
      res.status(500).json({ message: "Failed to generate summary" });
    }
  }
);

module.exports = router;
