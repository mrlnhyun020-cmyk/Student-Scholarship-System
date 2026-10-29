
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Student = require("../models/student");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const allowedFields = [
  "studentId",
  "fullName",
  "email",
  "course",
  "yearLevel",
  "scholarshipType",
  "scholarshipStatus",
];

// GET: Retrieve all student records
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET: Search student records
router.get("/search", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Please enter a search query.",
      });
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escapedQuery, "i");

    const students = await Student.find({
      $or: [
        { studentId: pattern },
        { fullName: pattern },
        { email: pattern },
        { course: pattern },
        { scholarshipType: pattern },
        { scholarshipStatus: pattern },
      ],
    });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET: Retrieve one student by MongoDB ID
router.get("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST: Add a student
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const student = await Student.create(req.body);

    res.status(201).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});



 // PUT: Update a student (admins cannot change identity fields)
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    // Prevent admins from changing identity fields
    const protectedFields = ["fullName", "studentId", "email"];

    const attemptedProtectedField = protectedFields.find((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field)
    );

    if (attemptedProtectedField) {
      return res.status(403).json({
        success: false,
        message: `${attemptedProtectedField} cannot be changed by the administrator.`,
      });
    }

    // Only these fields may be edited by admins
    const editableFields = [
      "course",
      "yearLevel",
      "scholarshipType",
      "scholarshipStatus",
    ];

    const updates = {};

    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid editable student fields provided.",
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student updated successfully.",
      data: student,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});


// DELETE: Remove a student
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student deleted successfully.",
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
