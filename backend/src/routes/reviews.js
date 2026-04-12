const express = require("express");
const Review = require("../models/Review");
const Student = require("../models/Student");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// POST /api/reviews — mentor only
router.post("/", authenticate, authorize("mentor"), async (req, res) => {
  try {
    const { studentId, reviewText, rating } = req.body;

    if (!studentId || !reviewText || !rating) {
      return res
        .status(400)
        .json({ message: "studentId, reviewText, and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const review = await Review.create({
      studentId,
      mentorId: req.user._id,
      reviewText,
      rating,
    });

    const populated = await review.populate([
      { path: "studentId", select: "name email" },
      { path: "mentorId", select: "name email" },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/reviews/:studentId — mentor or student can view
router.get(
  "/:studentId",
  authenticate,
  authorize("student", "mentor"),
  async (req, res) => {
    try {
      const reviews = await Review.find({ studentId: req.params.studentId })
        .populate("mentorId", "name email")
        .sort({ createdAt: -1 });

      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
