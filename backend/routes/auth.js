
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Student = require("../models/student");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register
// Public registration always creates a student account.
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !fullName.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "student",
    });

    return res.status(201).json({
      success: true,
      message: "Student account created successfully.",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to register account.",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from the environment.");

      return res.status(500).json({
        success: false,
        message: "Authentication is not configured.",
      });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in.",
    });
  }
});

// GET /api/auth/me
// Return the logged-in user's account and saved profile.
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "fullName email role studentId course yearLevel gradeAverage contactNumber"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    // Preserve the existing scholarship record lookup.
    let scholarship = null;

    if (user.role === "student") {
      scholarship = await Student.findOne({
        email: user.email,
      }).select(
        "studentId fullName email course yearLevel scholarshipType scholarshipStatus"
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          studentId: user.studentId || "",
          course: user.course || "",
          yearLevel: user.yearLevel || "",
          gradeAverage: user.gradeAverage ?? null,
          contactNumber: user.contactNumber || "",
        },
        scholarship,
      },
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your profile.",
    });
  }
});


// PUT /api/auth/profile
// Update the logged-in student's profile.
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only student accounts can update a student profile.",
      });
    }

    const {
      fullName,
      studentId,
      course,
      yearLevel,
      gradeAverage,
      contactNumber,
    } = req.body;

    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      typeof studentId !== "string" ||
      !studentId.trim() ||
      typeof course !== "string" ||
      !course.trim() ||
      typeof yearLevel !== "string" ||
      !yearLevel.trim() ||
      gradeAverage === "" ||
      gradeAverage === null ||
      gradeAverage === undefined ||
      !Number.isFinite(Number(gradeAverage)) ||
      Number(gradeAverage) < 0 ||
      Number(gradeAverage) > 100 ||
      (contactNumber !== undefined && typeof contactNumber !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide your name, student ID, course, year level, and a grade average from 0 to 100.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    user.fullName = fullName.trim();
    user.studentId = studentId.trim();
    user.course = course.trim();
    user.yearLevel = yearLevel.trim();
    user.gradeAverage = Number(gradeAverage);
    user.contactNumber =
      typeof contactNumber === "string" ? contactNumber.trim() : "";

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Student profile updated successfully.",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          studentId: user.studentId,
          course: user.course,
          yearLevel: user.yearLevel,
          gradeAverage: user.gradeAverage,
          contactNumber: user.contactNumber,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "That student ID is already in use.",
      });
    }

    console.error("Update profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update your profile.",
    });
  }
});

module.exports = router;
