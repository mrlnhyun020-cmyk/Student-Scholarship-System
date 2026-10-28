
const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Scholarship title is required'],
      trim: true,
    },
    provider: {
      type: String,
      required: [true, 'Scholarship provider is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    benefits: {
      type: String,
      required: [true, 'Scholarship benefits are required'],
      trim: true,
    },
    eligibility: {
      type: String,
      required: [true, 'Eligibility requirements are required'],
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
    },
    requiredDocuments: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Closed'],
      default: 'Draft',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scholarship', scholarshipSchema);
