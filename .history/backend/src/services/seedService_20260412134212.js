/**
 * /services/seedService.js
 *
 * Single source of truth pipeline:
 *   cleanedStudents.json → MongoDB (User + Student collections)
 *
 * Key behaviors:
 *   - Reads from cleaned_students.json (output of dataCleaner)
 *   - Creates a User (role: "student") for each student (skip if email exists)
 *   - Creates a Student record linked to that User (skip if email exists)
 *   - Creates default mentor account if not present
 *   - NEVER deletes existing data — safe to re-run
 */

const User = require("../models/User");
const Student = require("../models/Student");
const { getCleanedData } = require("../utils/dataCleaner");

const DEFAULT_PASSWORD = "password123";

// ─── Ensure mentor account exists ───────────────────────────────
async function ensureMentor() {
  const existing = await User.findOne({ email: "mentor@test.com" });
  if (existing) {
    console.log("  ✓ Mentor account already exists");
    return existing;
  }

  const mentor = await User.create({
    email: "mentor@test.com",
    password: DEFAULT_PASSWORD,
    name: "Dr. Sarah Wilson",
    role: "mentor",
  });
  console.log("  + Created mentor: mentor@test.com / password123");
  return mentor;
}

// ─── Seed students from cleanedStudents.json ────────────────────
async function seedStudentsFromCleanedData() {
  // 1. Read the cleaned dataset (single source of truth)
  const cleanedStudents = getCleanedData();
  console.log(`  Found ${cleanedStudents.length} students in cleaned dataset`);

  // 2. Ensure mentor exists (students need a mentorId reference)
  const mentor = await ensureMentor();

  let created = 0;
  let skipped = 0;

  for (const s of cleanedStudents) {
    // 3. Check if student already exists in DB (by email) — avoid duplicates
    const existingStudent = await Student.findOne({ email: s.email });
    if (existingStudent) {
      skipped++;
      continue;
    }

    // 4. Create a User account with role "student" (so they can log in)
    let user = await User.findOne({ email: s.email });
    if (!user) {
      user = await User.create({
        email: s.email,
        password: DEFAULT_PASSWORD,
        name: s.name,
        role: "student",
      });
    }

    // 5. Create the Student record linked to the User and mentor
    await Student.create({
      name: s.name,
      email: s.email,
      enrollmentDate: s.enrollmentDate ? new Date(s.enrollmentDate) : new Date(),
      course: s.course || "General",
      mentorId: mentor._id,
      status: s.status || "active",
    });

    created++;
  }

  console.log(`  + Created: ${created} | Skipped (already exist): ${skipped}`);
  return { created, skipped };
}

// ─── Auto-seed: only runs if DB is empty ────────────────────────
async function autoSeed() {
  const studentCount = await Student.countDocuments();
  const userCount = await User.countDocuments();

  if (studentCount > 0 && userCount > 0) {
    console.log("[Seed] Database already has data — skipping auto-seed");
    return false;
  }

  console.log("[Seed] Database is empty — seeding from cleanedStudents.json...");
  await seedStudentsFromCleanedData();
  console.log("[Seed] Auto-seed complete\n");
  return true;
}

module.exports = { seedStudentsFromCleanedData, ensureMentor, autoSeed };
