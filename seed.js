
require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("./models/student");

const students = [
  {
    studentId: "STU001",
    fullName: "Juan Dela Cruz",
    email: "juan@example.com",
    course: "BSIT",
    yearLevel: "2nd Year",
    scholarshipType: "Academic",
    scholarshipStatus: "Approved",
  },
  {
    studentId: "STU002",
    fullName: "Maria Santos",
    email: "maria@example.com",
    course: "BSCS",
    yearLevel: "3rd Year",
    scholarshipType: "Financial Assistance",
    scholarshipStatus: "Pending",
  },
  {
    studentId: "STU003",
    fullName: "Pedro Reyes",
    email: "pedro@example.com",
    course: "BSBA",
    yearLevel: "1st Year",
    scholarshipType: "Merit-Based",
    scholarshipStatus: "Approved",
  },
  {
    studentId: "STU004",
    fullName: "Ana Garcia",
    email: "ana@example.com",
    course: "BSED",
    yearLevel: "4th Year",
    scholarshipType: "Academic",
    scholarshipStatus: "Rejected",
  },
  {
    studentId: "STU005",
    fullName: "Mark Ramos",
    email: "mark@example.com",
    course: "BSIT",
    yearLevel: "2nd Year",
    scholarshipType: "Financial Assistance",
    scholarshipStatus: "Pending",
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas.");

    // Avoid inserting duplicate student IDs
    for (const student of students) {
      await Student.updateOne(
        { studentId: student.studentId },
        { $set: student },
        { upsert: true, runValidators: true }
      );
    }

    console.log("Seed completed successfully!");
    console.log(`${students.length} sample students added or updated.`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
