const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const connectDB = require("../config/db");
const User = require("../models/User");
const Student = require("../models/Student");
const Review = require("../models/Review");
const { cleanData } = require("./cleanData");

async function seed() {
  await connectDB();

  console.log("Clearing existing data...");
  await User.deleteMany({});
  await Student.deleteMany({});
  await Review.deleteMany({});

  // 1. Create users (mentor + student accounts)
  console.log("Creating users...");
  const mentor = await User.create({
    email: "mentor@test.com",
    password: "password123",
    name: "Dr. Sarah Wilson",
    role: "mentor",
  });

  const studentUser = await User.create({
    email: "student@test.com",
    password: "password123",
    name: "Alice Johnson",
    role: "student",
  });

  console.log("Users created:");
  console.log(`  Mentor: mentor@test.com / password123`);
  console.log(`  Student: student@test.com / password123`);

  // 2. Clean messy data and seed students
  console.log("\nCleaning dataset...");
  const cleanedStudents = cleanData();

  console.log("Seeding students...");
  const students = [];
  for (const s of cleanedStudents) {
    const student = await Student.create({
      name: s.name,
      email: s.email,
      enrollmentDate: s.enrollmentDate ? new Date(s.enrollmentDate) : new Date(),
      course: s.course,
      mentorId: mentor._id,
      status: s.status,
    });
    students.push(student);
  }

  // 3. Create sample reviews
  console.log("Creating sample reviews...");
  if (students.length > 0) {
    await Review.create({
      studentId: students[0]._id,
      mentorId: mentor._id,
      reviewText:
        "Alice has shown tremendous growth in her understanding of React fundamentals. She successfully completed the component lifecycle project and demonstrated solid debugging skills. However, she needs to focus more on state management patterns and should practice building larger applications with Redux or Context API. Her code quality is good but could benefit from more consistent naming conventions and better error handling practices. Overall, she is on track to becoming a proficient full-stack developer.",
      rating: 4,
      summary: [
        "Strengthen state management skills with Redux/Context API practice",
        "Improve code consistency with better naming conventions and error handling",
        "Build larger applications to solidify full-stack development abilities",
      ],
    });

    if (students.length > 1) {
      await Review.create({
        studentId: students[1]._id,
        mentorId: mentor._id,
        reviewText:
          "Bob is making steady progress with Node.js and Express. He has a good grasp of RESTful API design and middleware concepts. His database queries need optimization, and he should learn about indexing strategies. I recommend he works on authentication flows and real-time features with WebSockets next.",
        rating: 3,
      });
    }
  }

  console.log("\nSeed completed successfully!");
  console.log(`  ${students.length} students`);
  console.log(`  2 users (1 mentor, 1 student)`);
  console.log(`  Sample reviews created`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
