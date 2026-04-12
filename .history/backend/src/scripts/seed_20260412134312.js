/**
 * /scripts/seed.js
 *
 * Manual seed script — run with: npm run seed
 *
 * Flow:
 *   1. Connects to MongoDB
 *   2. Cleans messy data → writes cleaned_students.json
 *   3. Seeds DB from cleaned_students.json (single source of truth)
 *   4. Creates mentor + student user accounts
 *   5. Creates sample reviews for demo purposes
 *
 * Safe to re-run: skips existing records (no duplicates).
 * Use --fresh flag to wipe DB first: node src/scripts/seed.js --fresh
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const connectDB = require("../config/db");
const User = require("../models/User");
const Student = require("../models/Student");
const Review = require("../models/Review");
const { cleanData } = require("../utils/dataCleaner");
const { seedStudentsFromCleanedData, ensureMentor } = require("../services/seedService");

async function seed() {
  await connectDB();

  const isFresh = process.argv.includes("--fresh");

  if (isFresh) {
    console.log("--fresh flag detected: wiping all data...\n");
    await User.deleteMany({});
    await Student.deleteMany({});
    await Review.deleteMany({});
  }

  // Step 1: Clean the messy data → writes cleaned_students.json
  console.log("Step 1: Cleaning messy dataset...");
  cleanData();

  // Step 2: Seed students + user accounts from cleaned data
  console.log("Step 2: Seeding database from cleaned_students.json...");
  await seedStudentsFromCleanedData();

  // Step 3: Ensure mentor account exists
  const mentor = await ensureMentor();

  // Step 4: Create sample reviews (only if none exist)
  const reviewCount = await Review.countDocuments();
  if (reviewCount === 0) {
    console.log("\nStep 3: Creating sample reviews...");
    const firstStudent = await Student.findOne();
    if (firstStudent) {
      await Review.create({
        studentId: firstStudent._id,
        mentorId: mentor._id,
        reviewText:
          "Student has shown tremendous growth in understanding core fundamentals. Successfully completed the project and demonstrated solid debugging skills. However, needs to focus more on state management patterns and should practice building larger applications. Code quality is good but could benefit from more consistent naming conventions and better error handling practices.",
        rating: 4,
        summary: [],
      });
      console.log("  + Sample review created");
    }
  } else {
    console.log("\nStep 3: Reviews already exist — skipping sample data");
  }

  // Print login credentials
  console.log("\n=== Seed Complete ===");
  console.log("Login credentials:");
  console.log("  Mentor:  mentor@test.com / password123");

  const studentUsers = await User.find({ role: "student" }).limit(3);
  studentUsers.forEach((u) => {
    console.log(`  Student: ${u.email} / password123`);
  });

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
