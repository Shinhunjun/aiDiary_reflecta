const mongoose = require("mongoose");

const journalEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
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
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
    isAIGenerated: {
      type: Boolean,
      default: false,
    },
    relatedGoalId: {
      type: String, // Goal ID (can be main goal or sub-goal)
      default: null,
    },
    relatedGoalType: {
      type: String,
      enum: ["main", "sub", "sub-sub"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
journalEntrySchema.index({ userId: 1, date: -1 });
journalEntrySchema.index({ userId: 1, mood: 1 });
journalEntrySchema.index({ userId: 1, tags: 1 });
journalEntrySchema.index({ userId: 1, relatedGoalId: 1 });

module.exports = mongoose.model("JournalEntry", journalEntrySchema);
