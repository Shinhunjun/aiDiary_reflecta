const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["student", "counselor", "admin"],
      default: "student",
    },
    studentProfile: {
      studentId: String,
      grade: String,
      major: String,
      enrollmentYear: Number,
    },
    counselorProfile: {
      employeeId: String,
      department: String,
      specialization: [String],
      licenseNumber: String,
    },
    privacySettings: {
      riskMonitoring: {
        enabled: {
          type: Boolean,
          default: false,
        },
        shareLevel: {
          type: String,
          enum: ["summary", "moderate", "detailed"],
          default: "summary",
        },
        consentDate: Date,
      },
      assignedCounselors: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);
