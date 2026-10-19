const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    course: {
      type: String,
      required: true
    },
    yearLevel: {
      type: String,
      required: true
    },
    scholarshipType: {
      type: String,
      required: true
    },
    scholarshipStatus: {
      type: String,
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);