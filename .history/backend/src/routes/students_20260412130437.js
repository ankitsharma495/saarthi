const express = require("express");
const Student = require("../models/Student");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/students — authenticated users can see student list
router.get("/", authenticate, async (req, res) => {
  try {
    const students = await Student.find()
      .populate("mentorId", "name email")
      .sort({ name: 1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/students/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "mentorId",
      "name email"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
