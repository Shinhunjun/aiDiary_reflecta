const mongoose = require("mongoose");

const goalProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    goalId: {
      type: String, // mandalartData.id
      required: true,
    },
    subGoalId: {
      type: String, // subGoal.id (optional, for sub-goal progress)
    },
    progressType: {
      type: String,
      enum: ["milestone", "checkin", "completion", "reflection"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    mood: {
      type: String,
      enum: [
        "happy",
        "sad",
        "excited",
        "calm",
        "anxious",
        "grateful",
        "neutral",
        "reflective",
      ],
      default: "neutral",
    },
    tags: [String],
    isAIGenerated: {
      type: Boolean,
      default: false,
    },
    // Additional metadata
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
goalProgressSchema.index({ userId: 1, goalId: 1, date: -1 });
goalProgressSchema.index({ userId: 1, progressType: 1 });
goalProgressSchema.index({ goalId: 1, subGoalId: 1 });

module.exports = mongoose.model("GoalProgress", goalProgressSchema);
