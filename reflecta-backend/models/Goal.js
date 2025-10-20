const mongoose = require("mongoose");

const subGoalSchema = new mongoose.Schema({
  id: String,
  text: String,
  completed: { type: Boolean, default: false },
  description: String,
  dueDate: Date,
  subGoals: [mongoose.Schema.Types.Mixed], // Flexible schema for nested sub-goals
});

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mandalartData: {
      id: String,
      text: String,
      completed: { type: Boolean, default: false },
      description: String,
      dueDate: Date,
      subGoals: [subGoalSchema],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
goalSchema.index({ userId: 1 });

module.exports = mongoose.model("Goal", goalSchema);
