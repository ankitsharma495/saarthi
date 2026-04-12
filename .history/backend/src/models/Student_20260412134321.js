const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    enrollmentDate: {
      type: Date,
      required: true,
    },
    course: {
      type: String,
      default: "General",
      trim: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "completed"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
