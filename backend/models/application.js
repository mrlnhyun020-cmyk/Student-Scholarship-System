
const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    storageName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scholarship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scholarship",
      required: true,
    },
    course: {
      type: String,
      required: true,
      trim: true,
    },
    yearLevel: {
      type: String,
      required: true,
      trim: true,
    },
    gradeAverage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    statement: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    documents: {
      type: [documentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    adminFeedback: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate applications to the same scholarship.
applicationSchema.index(
  { student: 1, scholarship: 1 },
  { unique: true }
);

module.exports = mongoose.model("Application", applicationSchema);
