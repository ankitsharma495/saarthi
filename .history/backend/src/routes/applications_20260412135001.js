const express = require("express");
const Application = require("../models/Application");

const router = express.Router();

// POST /api/applications — public form submission
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, targetYear } = req.body;

    if (!name || !email || !phone || !targetYear) {
      return res.status(400).json({
        message: "All fields are required: name, email, phone, targetYear",
      });
    }

    // Check if already applied
    const existing = await Application.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "You have already applied" });
    }

    const application = await Application.create({
      name: name.trim(),
      email,
      phone: phone.trim(),
      targetYear: Number(targetYear),
    });

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
