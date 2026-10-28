
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Scholarship = require("../models/scholarship");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// GET: View published scholarships (students and admins)
router.get("/published", authenticateToken, async (req, res) => {
  try {
    const scholarships = await Scholarship.find({
      status: "Published",
      deadline: { $gte: new Date() },
    }).sort({ deadline: 1 });

    res.status(200).json({
      success: true,
      count: scholarships.length,
      data: scholarships,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET: Admin views all scholarships
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const scholarships = await Scholarship.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: scholarships.length,
      data: scholarships,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST: Admin creates a scholarship
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      provider,
      description,
      benefits,
      eligibility,
      deadline,
      requiredDocuments,
      status,
    } = req.body;

    const scholarship = await Scholarship.create({
      title,
      provider,
      description,
      benefits,
      eligibility,
      deadline,
      requiredDocuments,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Scholarship created successfully.",
      data: scholarship,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// PUT: Admin updates a scholarship
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid scholarship ID.",
      });
    }

    const allowedFields = [
      "title",
      "provider",
      "description",
      "benefits",
      "eligibility",
      "deadline",
      "requiredDocuments",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid scholarship fields provided.",
      });
    }

    const scholarship = await Scholarship.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: "Scholarship not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Scholarship updated successfully.",
      data: scholarship,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE: Admin deletes a scholarship
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid scholarship ID.",
      });
    }

    const scholarship = await Scholarship.findByIdAndDelete(req.params.id);

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: "Scholarship not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Scholarship deleted successfully.",
      data: scholarship,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
