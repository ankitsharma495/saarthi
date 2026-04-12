const express = require("express");
const Application = require("../models/Application");

const router = express.Router();

// Strip HTML tags and control characters, collapse whitespace
const sanitize = (str) =>
  String(str)
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s()-]{7,15}$/;
const NAME_RE = /^[a-zA-Z\s.'-]{2,50}$/;

// POST /api/applications — public form submission
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, targetYear } = req.body;

    if (!name || !email || !phone || !targetYear) {
      return res.status(400).json({
        message: "All fields are required: name, email, phone, targetYear",
      });
    }

    // Sanitize inputs
    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email).toLowerCase();
    const cleanPhone = sanitize(phone);
    const cleanYear = Number(targetYear);

    // Validate name
    if (!NAME_RE.test(cleanName)) {
      return res.status(400).json({
        message: "Name must be 2-50 characters and contain only letters, spaces, dots, hyphens, or apostrophes",
      });
    }

    // Validate email
    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate phone
    if (!PHONE_RE.test(cleanPhone)) {
      return res.status(400).json({
        message: "Phone must be 7-15 digits (may include +, spaces, dashes, parentheses)",
      });
    }

    // Validate target year
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(cleanYear) || cleanYear < currentYear || cleanYear > currentYear + 5) {
      return res.status(400).json({
        message: `Target year must be between ${currentYear} and ${currentYear + 5}`,
      });
    }

    // Check duplicate by email
    const existingByEmail = await Application.findOne({ email: cleanEmail });
    if (existingByEmail) {
      return res.status(409).json({ message: "An application with this email already exists" });
    }

    // Check duplicate by phone
    const existingByPhone = await Application.findOne({ phone: cleanPhone });
    if (existingByPhone) {
      return res.status(409).json({ message: "An application with this phone number already exists" });
    }

    const application = await Application.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      targetYear: cleanYear,
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
