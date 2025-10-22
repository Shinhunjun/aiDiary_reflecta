const mongoose = require("mongoose");

const riskAlertSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    riskFactors: [
      {
        type: {
          type: String,
          enum: [
            "mood_decline",
            "negative_keywords",
            "isolation_pattern",
            "stress_increase",
            "sleep_issues",
            "academic_struggle",
            "self_harm_indication",
            "suicidal_ideation",
          ],
        },
        severity: {
          type: String,
          enum: ["low", "medium", "high"],
        },
        description: String,
      },
    ],
    triggerSource: {
      type: String,
      enum: ["journal", "mood_pattern", "goal_progress", "chat"],
      required: true,
    },
    triggerEntryId: mongoose.Schema.Types.ObjectId,
    aiAnalysis: {
      summary: String,
      keyPhrases: [String],
      moodTrend: String,
      recommendations: [String],
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
    },
    status: {
      type: String,
      enum: ["new", "viewed", "in_progress", "resolved", "escalated"],
      default: "new",
    },
    assignedCounselors: [
      {
        counselorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    counselorNotes: [
      {
        counselorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        note: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        action: {
          type: String,
          enum: ["contacted", "scheduled", "referred", "monitoring", "resolved"],
        },
      },
    ],
    notificationsSent: [
      {
        type: {
          type: String,
          enum: ["email", "in_app", "sms"],
        },
        sentAt: Date,
        recipient: String,
      },
    ],
    followUpDate: Date,
    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indices for faster queries
riskAlertSchema.index({ studentId: 1, status: 1 });
riskAlertSchema.index({ riskLevel: 1, status: 1 });
riskAlertSchema.index({ createdAt: -1 });
riskAlertSchema.index({ "assignedCounselors.counselorId": 1 });

module.exports = mongoose.model("RiskAlert", riskAlertSchema);
