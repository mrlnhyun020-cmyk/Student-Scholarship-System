
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const Application = require("../models/application");
const Scholarship = require("../models/scholarship");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Store uploaded files outside the public frontend directory.
const uploadDirectory = path.join(__dirname, "../private_uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (req, file, callback) => {
    // Generate a server-side filename; never use the supplied filename as a path.
    callback(null, `${require("crypto").randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
    fields: 10,
    fieldSize: 10000,
  },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
      !allowedMimeTypes.includes(file.mimetype) ||
      !allowedExtensions.includes(extension)
    ) {
      return callback(
        new Error("Only PDF, JPG, JPEG, and PNG files are allowed.")
      );
    }

    callback(null, true);
  },
});

function deleteUploadedFiles(files = []) {
  for (const file of files) {
    if (file.path) {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (error) {
        console.error("Unable to remove uploaded file:", error.message);
      }
    }
  }
}

// Handle upload errors and remove any partially uploaded files.
function handleUploads(req, res, next) {
  upload.any()(req, res, (error) => {
    if (error) {
      deleteUploadedFiles(req.files || []);

      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Each document must be 5 MB or smaller."
          : error.code === "LIMIT_FILE_COUNT"
          ? "You can upload a maximum of 10 documents."
          : error.message || "Unable to upload documents.";

      return res.status(400).json({
        success: false,
        message,
      });
    }

    next();
  });
}

// POST: Student applies for a published scholarship and uploads required documents.
router.post("/", authenticateToken, handleUploads, async (req, res) => {
  const files = req.files || [];

  try {
    if (req.user.role !== "student") {
      deleteUploadedFiles(files);
      return res.status(403).json({
        success: false,
        message: "Only student accounts can submit applications.",
      });
    }

    const {
      scholarshipId,
      course,
      yearLevel,
      gradeAverage,
      statement,
    } = req.body;

    if (
      !scholarshipId ||
      !mongoose.isValidObjectId(scholarshipId) ||
      typeof course !== "string" ||
      !course.trim() ||
      typeof yearLevel !== "string" ||
      !yearLevel.trim() ||
      gradeAverage === undefined ||
      !Number.isFinite(Number(gradeAverage)) ||
      Number(gradeAverage) < 0 ||
      Number(gradeAverage) > 100 ||
      typeof statement !== "string" ||
      !statement.trim()
    ) {
      deleteUploadedFiles(files);
      return res.status(400).json({
        success: false,
        message: "Please provide valid application details.",
      });
    }

    const scholarship = await Scholarship.findOne({
      _id: scholarshipId,
      status: "Published",
      deadline: { $gte: new Date() },
    });

    if (!scholarship) {
      deleteUploadedFiles(files);
      return res.status(404).json({
        success: false,
        message: "This scholarship is unavailable or its deadline has passed.",
      });
    }

    const requiredDocuments = scholarship.requiredDocuments || [];

    // Each required document is uploaded under document_0, document_1, etc.
    const fileByIndex = new Map();

    for (const file of files) {
      const match = /^document_(\d+)$/.exec(file.fieldname);

      if (!match) {
        deleteUploadedFiles(files);
        return res.status(400).json({
          success: false,
          message: "An uploaded document has an invalid field name.",
        });
      }

      const index = Number(match[1]);

      if (
        index >= requiredDocuments.length ||
        fileByIndex.has(index)
      ) {
        deleteUploadedFiles(files);
        return res.status(400).json({
          success: false,
          message: "An uploaded document does not match the scholarship requirements.",
        });
      }

      fileByIndex.set(index, file);
    }

    const missingDocuments = requiredDocuments.filter(
      (_, index) => !fileByIndex.has(index)
    );

    if (missingDocuments.length > 0) {
      deleteUploadedFiles(files);
      return res.status(400).json({
        success: false,
        message: `Please upload all required documents: ${missingDocuments.join(", ")}.`,
      });
    }

    const documents = requiredDocuments
      .map((documentName, index) => {
        const file = fileByIndex.get(index);

        if (!file) return null;

        return {
          documentName,
          originalName: path.basename(file.originalname),
          storageName: file.filename,
          mimeType: file.mimetype,
          size: file.size,
        };
      })
      .filter(Boolean);

    const application = await Application.create({
      student: req.user.id,
      scholarship: scholarship._id,
      course: course.trim(),
      yearLevel: yearLevel.trim(),
      gradeAverage: Number(gradeAverage),
      statement: statement.trim(),
      documents,
    });

    return res.status(201).json({
      success: true,
      message: "Application and documents submitted successfully.",
      data: application,
    });
  } catch (error) {
    deleteUploadedFiles(files);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this scholarship.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Application submission error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit application.",
    });
  }
});

// GET: Student views their own applications.
router.get("/mine", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "This route is for student accounts.",
      });
    }

    const applications = await Application.find({
      student: req.user.id,
    })
      .populate("scholarship", "title provider deadline")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("Retrieve applications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your applications.",
    });
  }
});

// GET: Admin views all applications.
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("student", "fullName email")
      .populate("scholarship", "title provider deadline")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("Retrieve all applications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve applications.",
    });
  }
});


/* GET: Open an application document securely.
   Admins and the student who owns the application may access it. */
router.get(
  "/:id/documents/:documentId",
  authenticateToken,
  async (req, res) => {
    try {
      const { id, documentId } = req.params;

      if (
        !mongoose.isValidObjectId(id) ||
        !mongoose.isValidObjectId(documentId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid application or document ID.",
        });
      }

      const application = await Application.findById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found.",
        });
      }

      const isAdmin = req.user.role === "admin";
      const isOwner =
        req.user.role === "student" &&
        application.student.toString() === req.user.id;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to access this document.",
        });
      }

      const document = application.documents.id(documentId);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: "Document not found.",
        });
      }

      // Use only the stored filename, never a path supplied by the request.
      const safeFilename = path.basename(document.storageName);
      const filePath = path.resolve(uploadDirectory, safeFilename);

      if (
        !filePath.startsWith(uploadDirectory + path.sep) ||
        !fs.existsSync(filePath)
      ) {
        return res.status(404).json({
          success: false,
          message: "The uploaded file could not be found.",
        });
      }

      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="document${path.extname(safeFilename)}"`
      );

      return res.sendFile(filePath, (error) => {
        if (error && !res.headersSent) {
          console.error("Document retrieval error:", error);
          res.status(500).json({
            success: false,
            message: "Unable to open the document.",
          });
        }
      });
    } catch (error) {
      console.error("Secure document access error:", error);

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "Unable to retrieve the document.",
        });
      }
    }
  }
);


// PATCH: Admin approves or rejects an application.
router.patch(
  "/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid application ID.",
        });
      }

      const { status, adminFeedback = "" } = req.body;

      if (!["Pending", "Approved", "Rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be Pending, Approved, or Rejected.",
        });
      }

      if (
        typeof adminFeedback !== "string" ||
        adminFeedback.length > 2000
      ) {
        return res.status(400).json({
          success: false,
          message: "Admin feedback must be text up to 2000 characters.",
        });
      }

      const application = await Application.findByIdAndUpdate(
        req.params.id,
        {
          status,
          adminFeedback: adminFeedback.trim(),
        },
        { new: true, runValidators: true }
      )
        .populate("student", "fullName email")
        .populate("scholarship", "title provider deadline");

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Application status updated successfully.",
        data: application,
      });
    } catch (error) {
      console.error("Update application status error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update application status.",
      });
    }
  }
);

module.exports = router;
