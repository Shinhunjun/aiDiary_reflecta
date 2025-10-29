const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map(origin => origin.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Helper utilities for progress summaries
const PERIOD_OPTIONS = ["weekly", "monthly", "quarterly", "yearly"];

const getPeriodBounds = (period = "weekly") => {
  const now = new Date();
  let start;

  switch (period) {
    case "weekly": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      start = new Date(now.getFullYear(), now.getMonth(), diff);
      break;
    }
    case "monthly":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarterly": {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), currentQuarter * 3, 1);
      break;
    }
    case "yearly":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  }

  start.setHours(0, 0, 0, 0);
  return { start, end: now };
};

const getTimelineFormat = (period = "weekly") => {
  switch (period) {
    case "weekly":
    case "monthly":
      return "%Y-%m-%d";
    case "quarterly":
      return "%Y-%m-%d";
    case "yearly":
      return "%Y-%m";
    default:
      return "%Y-%m-%d";
  }
};

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/reflecta", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Models
const User = require("./models/User");
const Goal = require("./models/Goal");
const JournalEntry = require("./models/JournalEntry");
const ChatSession = require("./models/ChatSession");
const GoalProgress = require("./models/GoalProgress");
const RiskAlert = require("./models/RiskAlert");

// Middleware and Services
const { requireRole, canAccessStudent, canModifyAlert } = require("./middleware/authorization");
const riskDetectionService = require("./services/riskDetectionService");

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret",
    (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      req.user = user;
      next();
    }
  );
};

// Routes

// Auth Routes
app.post(
  "/api/auth/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("name").trim().isLength({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user (default role is 'student')
      const user = new User({
        email,
        password: hashedPassword,
        name,
        role: "student",
      });

      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
      );

      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Counselor registration with secret code
app.post(
  "/api/auth/register-counselor",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("name").trim().isLength({ min: 1 }),
    body("secretCode").trim().isLength({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, secretCode } = req.body;

      // Verify secret code
      if (secretCode !== "trustmatter!") {
        return res.status(403).json({ error: "Invalid secret code" });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create counselor user
      const user = new User({
        email,
        password: hashedPassword,
        name,
        role: "counselor",
      });

      await user.save();

      // Generate JWT with role
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
      );

      res.status(201).json({
        message: "Counselor account created successfully",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Counselor registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/api/auth/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT with role
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get current user info
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Goals Routes
app.get("/api/goals", authenticateToken, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.userId });
    res.json(goals);
  } catch (error) {
    console.error("Get goals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/goals", authenticateToken, async (req, res) => {
  try {
    const { mandalartData } = req.body;

    let goal = await Goal.findOne({ userId: req.user.userId });

    if (goal) {
      goal.mandalartData = mandalartData;
      goal.updatedAt = new Date();
    } else {
      goal = new Goal({
        userId: req.user.userId,
        mandalartData,
      });
    }

    await goal.save();
    res.json({ message: "Goals saved successfully", goal });
  } catch (error) {
    console.error("Save goals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Journal Routes
app.get("/api/journal", authenticateToken, async (req, res) => {
  try {
    const entries = await JournalEntry.find({ userId: req.user.userId }).sort({
      date: -1,
    });
    res.json(entries);
  } catch (error) {
    console.error("Get journal entries error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get specific journal entry
app.get("/api/journal/:id", authenticateToken, async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    res.json(entry);
  } catch (error) {
    console.error("Get journal entry error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post(
  "/api/journal",
  authenticateToken,
  [
    body("title").trim().isLength({ min: 1 }),
    body("content").trim().isLength({ min: 1 }),
    body("mood").isIn([
      "happy",
      "sad",
      "excited",
      "calm",
      "anxious",
      "grateful",
      "neutral",
      "reflective",
    ]),
    body("tags").isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        content,
        mood,
        tags,
        isAIGenerated = false,
        relatedGoalId,
        relatedGoalType,
      } = req.body;

      // If no goal mapping provided, try to analyze the content
      let finalRelatedGoalId = relatedGoalId || null;
      let finalRelatedGoalType = relatedGoalType || null;

      if (!finalRelatedGoalId && isAIGenerated) {
        try {
          // Get user's goals structure for analysis
          const goals = await Goal.find({ userId: req.user.userId });
          const flattenedGoals = [];

          goals.forEach((goal) => {
            if (goal.mandalartData) {
              // Main goal
              flattenedGoals.push({
                id: goal.mandalartData.id,
                text: goal.mandalartData.text,
                type: "main",
                description: goal.mandalartData.description || "",
              });

              // Sub-goals
              if (goal.mandalartData.subGoals) {
                goal.mandalartData.subGoals.forEach((subGoal) => {
                  if (subGoal && subGoal.text) {
                    flattenedGoals.push({
                      id: subGoal.id,
                      text: subGoal.text,
                      type: "sub",
                      description: subGoal.description || "",
                    });

                    // Sub-sub-goals
                    if (subGoal.subGoals) {
                      subGoal.subGoals.forEach((subSubGoal) => {
                        if (subSubGoal && subSubGoal.text) {
                          flattenedGoals.push({
                            id: subSubGoal.id,
                            text: subSubGoal.text,
                            type: "sub-sub",
                            description: subSubGoal.description || "",
                          });
                        }
                      });
                    }
                  }
                });
              }
            }
          });

          // Simple keyword matching for goal mapping
          const contentLower = content.toLowerCase();
          if (
            contentLower.includes("run") ||
            contentLower.includes("running")
          ) {
            const runGoal = flattenedGoals.find(
              (goal) => goal.text && goal.text.toLowerCase().includes("run")
            );
            if (runGoal) {
              finalRelatedGoalId = runGoal.id;
              finalRelatedGoalType = runGoal.type;
            }
          }
        } catch (error) {
          console.error("Error analyzing goal mapping:", error);
        }
      }

      const entry = new JournalEntry({
        userId: req.user.userId,
        title,
        content,
        mood,
        tags: tags || [],
        date: new Date(),
        isAIGenerated,
        relatedGoalId: finalRelatedGoalId,
        relatedGoalType: finalRelatedGoalType,
      });

      await entry.save();
      res
        .status(201)
        .json({ message: "Journal entry saved successfully", entry });
    } catch (error) {
      console.error("Save journal entry error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Goal Progress Routes
app.get("/api/goals/:goalId/progress", authenticateToken, async (req, res) => {
  try {
    const { goalId } = req.params;
    const progress = await GoalProgress.find({
      userId: req.user.userId,
      goalId: goalId,
    }).sort({ date: -1 });

    res.json(progress);
  } catch (error) {
    console.error("Get goal progress error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get(
  "/api/goals/:goalId/progress/summary",
  authenticateToken,
  async (req, res) => {
    try {
      const { goalId } = req.params;
      const periodParam = (req.query.period || "weekly").toLowerCase();
      const period = PERIOD_OPTIONS.includes(periodParam)
        ? periodParam
        : "weekly";

      const { start, end } = getPeriodBounds(period);

      const matchStage = {
        userId: mongoose.Types.ObjectId.isValid(req.user.userId)
          ? new mongoose.Types.ObjectId(req.user.userId)
          : req.user.userId,
        goalId,
      };

      if (start && end) {
        matchStage.date = { $gte: start, $lte: end };
      }

      const basePipeline = [{ $match: matchStage }];

      console.log("Progress summary request", {
        userId: req.user.userId,
        goalId,
        period,
        range: { start, end },
      });

      const [totals = null] = await GoalProgress.aggregate([
        ...basePipeline,
        {
          $group: {
            _id: null,
            totalEntries: { $sum: 1 },
            totalTime: { $sum: "$timeSpent" },
            lastActivity: { $max: "$date" },
          },
        },
      ]);

      console.log("Progress totals", totals);

      const typeBreakdown = await GoalProgress.aggregate([
        ...basePipeline,
        {
          $group: {
            _id: "$progressType",
            count: { $sum: 1 },
            lastEntry: { $max: "$date" },
          },
        },
        { $sort: { count: -1 } },
      ]);

      console.log("Progress type breakdown", typeBreakdown);

      const subGoalAggregation = await GoalProgress.aggregate([
        ...basePipeline,
        {
          $addFields: {
            subGoalKey: { $ifNull: ["$subGoalId", "__main__"] },
          },
        },
        {
          $group: {
            _id: "$subGoalKey",
            count: { $sum: 1 },
            totalTime: { $sum: "$timeSpent" },
            lastEntry: { $max: "$date" },
          },
        },
        { $sort: { count: -1 } },
      ]);

      console.log("Sub-goal aggregation", subGoalAggregation);

      const timelineFormat = getTimelineFormat(period);
      const timeline = await GoalProgress.aggregate([
        ...basePipeline,
        {
          $group: {
            _id: {
              bucket: {
                $dateToString: { format: timelineFormat, date: "$date" },
              },
              type: "$progressType",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.bucket",
            total: { $sum: "$count" },
            breakdown: {
              $push: { type: "$_id.type", count: "$count" },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      console.log("Timeline aggregation", timeline);

      // Build label map for goals/sub-goals
      const goalDoc = await Goal.findOne({
        userId: req.user.userId,
        "mandalartData.id": goalId,
      });

      const goalLabelMap = {};
      if (goalDoc?.mandalartData) {
        const traverse = (node, depth = 0) => {
          if (!node || !node.id) return;
          goalLabelMap[node.id] = node.text || "Unnamed Goal";
          if (Array.isArray(node.subGoals)) {
            node.subGoals
              .filter(Boolean)
              .forEach((child) => traverse(child, depth + 1));
          }
        };
        traverse(goalDoc.mandalartData);
      }

      const subGoals = subGoalAggregation.map((entry) => {
        const isMain = entry._id === "__main__";
        return {
          id: isMain ? goalId : entry._id,
          label: isMain
            ? goalLabelMap[goalId] || "Main Goal"
            : goalLabelMap[entry._id] || "Sub Goal",
          count: entry.count,
          totalTime: entry.totalTime,
          lastEntry: entry.lastEntry,
        };
      });

      res.json({
        goalId,
        period,
        range: {
          start: start?.toISOString() || null,
          end: end?.toISOString() || null,
        },
        totals: totals || {
          totalEntries: 0,
          totalTime: 0,
          lastActivity: null,
        },
        progressTypes: typeBreakdown.map((item) => ({
          type: item._id,
          count: item.count,
          lastEntry: item.lastEntry,
        })),
        subGoals,
        timeline: timeline.map((item) => ({
          bucket: item._id,
          total: item.total,
          breakdown: item.breakdown,
        })),
      });
    } catch (error) {
      console.error("Get goal progress summary error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/api/goals/:goalId/progress",
  authenticateToken,
  [
    body("title").trim().isLength({ min: 1 }),
    body("description").trim().isLength({ min: 1 }),
    body("progressType").isIn([
      "milestone",
      "checkin",
      "completion",
      "reflection",
    ]),
    body("mood")
      .optional()
      .isIn([
        "happy",
        "sad",
        "excited",
        "calm",
        "anxious",
        "grateful",
        "neutral",
        "reflective",
      ]),
    body("difficulty").optional().isIn(["easy", "medium", "hard"]),
    body("timeSpent").optional().isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { goalId } = req.params;
      const {
        subGoalId,
        progressType,
        title,
        description,
        mood = "neutral",
        tags = [],
        difficulty = "medium",
        timeSpent = 0,
        notes,
        isAIGenerated = false,
      } = req.body;

      const progress = new GoalProgress({
        userId: req.user.userId,
        goalId,
        subGoalId,
        progressType,
        title,
        description,
        mood,
        tags,
        difficulty,
        timeSpent,
        notes,
        isAIGenerated,
      });

      await progress.save();
      res
        .status(201)
        .json({ message: "Goal progress saved successfully", progress });
    } catch (error) {
      console.error("Save goal progress error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Advanced Analytics Endpoint
app.get(
  "/api/goals/:goalId/progress/analytics",
  authenticateToken,
  async (req, res) => {
    try {
      const { goalId } = req.params;
      const userId = mongoose.Types.ObjectId.isValid(req.user.userId)
        ? new mongoose.Types.ObjectId(req.user.userId)
        : req.user.userId;

      // Get all progress entries for velocity calculation
      const allProgress = await GoalProgress.find({
        userId,
        goalId,
      }).sort({ date: 1 });

      // Calculate velocity (progress per week)
      const velocityData = [];
      if (allProgress.length > 0) {
        const startDate = new Date(allProgress[0].date);
        const endDate = new Date();
        const weeksDiff = Math.ceil(
          (endDate - startDate) / (7 * 24 * 60 * 60 * 1000)
        );

        for (let i = 0; i < weeksDiff; i++) {
          const weekStart = new Date(startDate);
          weekStart.setDate(weekStart.getDate() + i * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);

          const weekProgress = allProgress.filter((p) => {
            const pDate = new Date(p.date);
            return pDate >= weekStart && pDate < weekEnd;
          });

          velocityData.push({
            week: i + 1,
            weekStart: weekStart.toISOString(),
            count: weekProgress.length,
            timeSpent: weekProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0),
            completionPercentage:
              weekProgress.reduce((sum, p) => sum + (p.completionPercentage || 0), 0) /
              (weekProgress.length || 1),
          });
        }
      }

      // Get goal structure for completion calculation
      const goalDoc = await Goal.findOne({
        userId,
        "mandalartData.id": goalId,
      });

      let totalSubGoals = 0;
      let completedSubGoals = 0;
      if (goalDoc?.mandalartData) {
        const countGoals = (node) => {
          if (!node) return;
          totalSubGoals++;
          if (node.completed) completedSubGoals++;
          if (Array.isArray(node.subGoals)) {
            node.subGoals.filter(Boolean).forEach(countGoals);
          }
        };
        if (Array.isArray(goalDoc.mandalartData.subGoals)) {
          goalDoc.mandalartData.subGoals.filter(Boolean).forEach(countGoals);
        }
      }

      const overallCompletion =
        totalSubGoals > 0 ? (completedSubGoals / totalSubGoals) * 100 : 0;

      // Mood correlation with progress type
      const moodCorrelation = await GoalProgress.aggregate([
        { $match: { userId, goalId } },
        {
          $group: {
            _id: { mood: "$mood", progressType: "$progressType" },
            count: { $sum: 1 },
            avgTimeSpent: { $avg: "$timeSpent" },
            avgCompletion: { $avg: "$completionPercentage" },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Difficulty distribution
      const difficultyStats = await GoalProgress.aggregate([
        { $match: { userId, goalId } },
        {
          $group: {
            _id: "$difficulty",
            count: { $sum: 1 },
            avgTimeSpent: { $avg: "$timeSpent" },
            avgCompletion: { $avg: "$completionPercentage" },
          },
        },
      ]);

      // Milestone tracking
      const milestones = await GoalProgress.find({
        userId,
        goalId,
        isMilestone: true,
      }).sort({ date: -1 });

      // Activity heatmap data (for calendar view)
      const heatmapData = await GoalProgress.aggregate([
        { $match: { userId, goalId } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" },
            },
            count: { $sum: 1 },
            totalTime: { $sum: "$timeSpent" },
            types: { $addToSet: "$progressType" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Predicted completion date based on velocity
      let predictedCompletion = null;
      if (velocityData.length > 1 && overallCompletion < 100) {
        const recentVelocity = velocityData.slice(-4); // Last 4 weeks
        const avgWeeklyProgress =
          recentVelocity.reduce((sum, w) => sum + w.completionPercentage, 0) /
          recentVelocity.length;
        if (avgWeeklyProgress > 0) {
          const remainingPercentage = 100 - overallCompletion;
          const weeksToComplete = remainingPercentage / avgWeeklyProgress;
          const predicted = new Date();
          predicted.setDate(predicted.getDate() + weeksToComplete * 7);
          predictedCompletion = predicted.toISOString();
        }
      }

      res.json({
        goalId,
        overallCompletion: Math.round(overallCompletion * 10) / 10,
        totalSubGoals,
        completedSubGoals,
        velocityData,
        moodCorrelation: moodCorrelation.map((item) => ({
          mood: item._id.mood,
          progressType: item._id.progressType,
          count: item.count,
          avgTimeSpent: Math.round(item.avgTimeSpent || 0),
          avgCompletion: Math.round((item.avgCompletion || 0) * 10) / 10,
        })),
        difficultyStats: difficultyStats.map((item) => ({
          difficulty: item._id,
          count: item.count,
          avgTimeSpent: Math.round(item.avgTimeSpent || 0),
          avgCompletion: Math.round((item.avgCompletion || 0) * 10) / 10,
        })),
        milestones: milestones.map((m) => ({
          id: m._id,
          title: m.milestoneTitle || m.title,
          category: m.milestoneCategory,
          date: m.date,
          completionPercentage: m.completionPercentage,
          emoji: m.celebrationEmoji,
        })),
        heatmapData: heatmapData.map((item) => ({
          date: item._id,
          count: item.count,
          totalTime: item.totalTime,
          types: item.types,
        })),
        predictedCompletion,
      });
    } catch (error) {
      console.error("Get goal analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// AI-Powered Insights Endpoint
app.get(
  "/api/goals/:goalId/progress/insights",
  authenticateToken,
  async (req, res) => {
    try {
      const { goalId } = req.params;
      const userId = mongoose.Types.ObjectId.isValid(req.user.userId)
        ? new mongoose.Types.ObjectId(req.user.userId)
        : req.user.userId;

      // Get progress data
      const progressEntries = await GoalProgress.find({
        userId,
        goalId,
      })
        .sort({ date: -1 })
        .limit(50);

      if (progressEntries.length === 0) {
        return res.json({
          insights: [],
          message: "Not enough data to generate insights yet.",
        });
      }

      const insights = [];

      // Pattern 1: Best performing time of day
      const timePatterns = {};
      progressEntries.forEach((entry) => {
        const hour = new Date(entry.date).getHours();
        const timeOfDay =
          hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
        if (!timePatterns[timeOfDay]) {
          timePatterns[timeOfDay] = { count: 0, totalCompletion: 0 };
        }
        timePatterns[timeOfDay].count++;
        timePatterns[timeOfDay].totalCompletion += entry.completionPercentage || 0;
      });

      let bestTime = null;
      let maxAvg = 0;
      Object.keys(timePatterns).forEach((time) => {
        const avg = timePatterns[time].totalCompletion / timePatterns[time].count;
        if (avg > maxAvg) {
          maxAvg = avg;
          bestTime = time;
        }
      });

      if (bestTime) {
        insights.push({
          type: "pattern",
          category: "timing",
          title: `You're most productive in the ${bestTime}`,
          description: `Your ${bestTime} check-ins show ${Math.round(maxAvg)}% higher completion rates.`,
          icon: bestTime === "morning" ? "🌅" : bestTime === "afternoon" ? "☀️" : "🌙",
          confidence: timePatterns[bestTime].count >= 5 ? "high" : "medium",
        });
      }

      // Pattern 2: Mood-productivity correlation
      const moodStats = {};
      progressEntries.forEach((entry) => {
        if (entry.mood && entry.completionPercentage > 0) {
          if (!moodStats[entry.mood]) {
            moodStats[entry.mood] = { count: 0, totalCompletion: 0 };
          }
          moodStats[entry.mood].count++;
          moodStats[entry.mood].totalCompletion += entry.completionPercentage;
        }
      });

      const sortedMoods = Object.entries(moodStats)
        .map(([mood, data]) => ({
          mood,
          avgCompletion: data.totalCompletion / data.count,
          count: data.count,
        }))
        .sort((a, b) => b.avgCompletion - a.avgCompletion);

      if (sortedMoods.length > 0 && sortedMoods[0].count >= 3) {
        const bestMood = sortedMoods[0];
        const moodEmojis = {
          happy: "😊",
          excited: "🎉",
          calm: "😌",
          grateful: "🙏",
          neutral: "😐",
          anxious: "😰",
          sad: "😢",
          reflective: "🤔",
        };
        insights.push({
          type: "correlation",
          category: "mood",
          title: `Your best work happens when you're ${bestMood.mood}`,
          description: `Progress entries logged while feeling ${bestMood.mood} show ${Math.round(bestMood.avgCompletion)}% completion on average.`,
          icon: moodEmojis[bestMood.mood] || "💡",
          confidence: bestMood.count >= 5 ? "high" : "medium",
        });
      }

      // Pattern 3: Consistency streak
      const sortedByDate = [...progressEntries].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      let currentStreak = 1;
      let maxStreak = 1;
      for (let i = 1; i < sortedByDate.length; i++) {
        const prevDate = new Date(sortedByDate[i - 1].date);
        const currDate = new Date(sortedByDate[i].date);
        const dayDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
        if (dayDiff <= 2) {
          // Allow 1 day gap
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }

      if (maxStreak >= 3) {
        insights.push({
          type: "achievement",
          category: "consistency",
          title: `${maxStreak}-day streak achieved!`,
          description: `You've maintained consistent progress for ${maxStreak} days. Keep the momentum going!`,
          icon: "🔥",
          confidence: "high",
        });
      }

      // Pattern 4: Time investment efficiency
      const entriesWithTime = progressEntries.filter((e) => e.timeSpent > 0);
      if (entriesWithTime.length >= 5) {
        const avgTimePerEntry =
          entriesWithTime.reduce((sum, e) => sum + e.timeSpent, 0) /
          entriesWithTime.length;
        const avgCompletionPerEntry =
          entriesWithTime.reduce((sum, e) => sum + (e.completionPercentage || 0), 0) /
          entriesWithTime.length;
        const efficiency = avgCompletionPerEntry / avgTimePerEntry;

        insights.push({
          type: "metric",
          category: "efficiency",
          title: `Average ${Math.round(avgTimePerEntry)} minutes per check-in`,
          description: `Your time investment is ${efficiency > 0.5 ? "highly efficient" : "moderate"}. ${Math.round(avgCompletionPerEntry)}% progress per session.`,
          icon: "⏱️",
          confidence: "high",
        });
      }

      // Pattern 5: Difficulty preference
      const difficultyCount = {
        easy: 0,
        medium: 0,
        hard: 0,
      };
      progressEntries.forEach((entry) => {
        if (entry.difficulty) {
          difficultyCount[entry.difficulty]++;
        }
      });
      const totalWithDifficulty = Object.values(difficultyCount).reduce(
        (a, b) => a + b,
        0
      );
      if (totalWithDifficulty >= 5) {
        const sortedDifficulty = Object.entries(difficultyCount).sort(
          (a, b) => b[1] - a[1]
        );
        const preference = sortedDifficulty[0][0];
        const percentage = Math.round(
          (sortedDifficulty[0][1] / totalWithDifficulty) * 100
        );
        insights.push({
          type: "preference",
          category: "difficulty",
          title: `You prefer ${preference} difficulty tasks`,
          description: `${percentage}% of your progress entries are marked as ${preference} difficulty.`,
          icon: preference === "hard" ? "💪" : preference === "medium" ? "⚖️" : "✅",
          confidence: percentage >= 60 ? "high" : "medium",
        });
      }

      // Recommendation: Based on gaps
      const now = new Date();
      const lastEntry = new Date(progressEntries[0].date);
      const daysSinceLastEntry = Math.floor((now - lastEntry) / (1000 * 60 * 60 * 24));

      if (daysSinceLastEntry >= 3) {
        insights.push({
          type: "recommendation",
          category: "consistency",
          title: "Time for a check-in!",
          description: `It's been ${daysSinceLastEntry} days since your last progress update. Regular check-ins help maintain momentum.`,
          icon: "📝",
          confidence: "high",
        });
      }

      res.json({
        goalId,
        insights,
        dataPoints: progressEntries.length,
        analyzedPeriod: {
          start: sortedByDate[0]?.date,
          end: sortedByDate[sortedByDate.length - 1]?.date,
        },
      });
    } catch (error) {
      console.error("Get goal insights error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Goal Related Journal Entries Routes
app.get("/api/goals/:goalId/journals", authenticateToken, async (req, res) => {
  try {
    const { goalId } = req.params;
    console.log(
      "Getting journals for goalId:",
      goalId,
      "userId:",
      req.user?.userId
    );

    const journals = await JournalEntry.find({
      userId: req.user.userId,
      relatedGoalId: goalId,
    }).sort({ date: -1 });

    console.log("Found journals:", journals.length);
    res.json(journals);
  } catch (error) {
    console.error("Get goal journals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get AI-powered summary of journals for a goal
app.get("/api/goals/:goalId/journals/summary", authenticateToken, async (req, res) => {
  try {
    const { goalId } = req.params;
    const userId = req.user.userId;

    // Get journals for this goal
    const journals = await JournalEntry.find({
      userId: userId,
      relatedGoalId: goalId,
    }).sort({ date: -1 }).limit(20); // Last 20 entries

    if (journals.length === 0) {
      return res.json({
        summary: "No journal entries found for this goal yet. Start journaling to see insights!",
        entryCount: 0,
        dateRange: null,
        moodDistribution: {},
        keyThemes: [],
      });
    }

    // Get goal info
    const goal = await Goal.findOne({
      userId: userId,
      $or: [
        { "mandalartData.id": goalId },
        { "mandalartData.subGoals.id": goalId },
        { "mandalartData.subGoals.subGoals.id": goalId }
      ]
    });

    let goalText = "this goal";
    if (goal) {
      // Find the specific goal text
      const findGoalText = (data, id) => {
        if (data.id === id) return data.text;
        if (data.subGoals) {
          for (const sg of data.subGoals) {
            if (sg && sg.id === id) return sg.text;
            if (sg && sg.subGoals) {
              for (const ssg of sg.subGoals) {
                if (ssg && ssg.id === id) return ssg.text;
              }
            }
          }
        }
        return null;
      };
      goalText = findGoalText(goal.mandalartData, goalId) || goalText;
    }

    // Calculate basic stats
    const dateRange = {
      start: journals[journals.length - 1].date,
      end: journals[0].date,
    };

    const moodDistribution = journals.reduce((acc, j) => {
      acc[j.mood] = (acc[j.mood] || 0) + 1;
      return acc;
    }, {});

    // Prepare content for AI
    const journalContents = journals.map((j, idx) => {
      return `Entry ${idx + 1} (${j.date.toISOString().split('T')[0]}, Mood: ${j.mood}):\n${j.content}`;
    }).join('\n\n');

    // Call OpenAI for summary
    try {
      const openaiResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a reflective journal analyst. Summarize the user's journal entries related to their goal "${goalText}". Focus on:
1. Overall progress and journey towards the goal
2. Emotional patterns and mindset changes
3. Key achievements and challenges
4. Recurring themes or insights
5. Actionable observations

Keep the summary concise (3-4 paragraphs), supportive, and insightful.`
            },
            {
              role: "user",
              content: `Here are ${journals.length} journal entries related to the goal "${goalText}":\n\n${journalContents}\n\nPlease provide a thoughtful summary.`
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      const aiSummary = openaiResponse.data.choices[0].message.content;

      // Extract key themes using simple keyword analysis
      const allContent = journals.map(j => j.content.toLowerCase()).join(' ');
      const commonWords = ['goal', 'progress', 'learning', 'challenge', 'achievement', 'development', 'growth', 'improvement', 'struggle', 'success'];
      const keyThemes = commonWords.filter(word => allContent.includes(word));

      res.json({
        summary: aiSummary,
        entryCount: journals.length,
        dateRange,
        moodDistribution,
        keyThemes: keyThemes.slice(0, 5),
        goalText,
      });

    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError.response?.data || openaiError.message);

      // Fallback: Basic summary without AI
      const moodList = Object.entries(moodDistribution)
        .sort((a, b) => b[1] - a[1])
        .map(([mood, count]) => `${mood} (${count})`)
        .join(', ');

      const fallbackSummary = `You have written ${journals.length} journal entries related to "${goalText}" from ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}. Your mood distribution: ${moodList}. Keep up the journaling to track your progress!`;

      res.json({
        summary: fallbackSummary,
        entryCount: journals.length,
        dateRange,
        moodDistribution,
        keyThemes: [],
        goalText,
      });
    }

  } catch (error) {
    console.error("Get goal journal summary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 임시 테스트용 API (인증 없음)
app.get("/api/test/goals/:goalId/journals", async (req, res) => {
  try {
    const { goalId } = req.params;
    console.log("Test API - Getting journals for goalId:", goalId);

    const journals = await JournalEntry.find({
      relatedGoalId: goalId,
    }).sort({ date: -1 });

    console.log("Test API - Found journals:", journals.length);
    res.json(journals);
  } catch (error) {
    console.error("Test API - Get goal journals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Test API - Get all journals (for debugging)
app.get("/api/test/journals", async (req, res) => {
  try {
    const journals = await JournalEntry.find({}).sort({ date: -1 });
    console.log("Test API - Found all journals:", journals.length);
    res.json(journals);
  } catch (error) {
    console.error("Test API - Get all journals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Test API - Get all goals (for debugging)
app.get("/api/test/goals", async (req, res) => {
  try {
    const goals = await Goal.find({}).sort({ createdAt: -1 });
    console.log("Test API - Found all goals:", goals.length);
    res.json(goals);
  } catch (error) {
    console.error("Test API - Get all goals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Test API - Get all users (for debugging)
app.get("/api/test/users", async (req, res) => {
  try {
    const users = await User.find({})
      .select("_id name email createdAt")
      .sort({ createdAt: -1 });
    console.log("Test API - Found all users:", users.length);
    res.json(users);
  } catch (error) {
    console.error("Test API - Get all users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Convert conversation to diary with goal mapping
app.post("/api/convert-to-diary", authenticateToken, async (req, res) => {
  try {
    const { conversationText } = req.body;

    if (!conversationText) {
      return res.status(400).json({ error: "Conversation text is required" });
    }

    // Get user's goals structure
    const goals = await Goal.find({ userId: req.user.userId });
    const flattenedGoals = [];

    goals.forEach((goal) => {
      if (goal.mandalartData) {
        // Main goal
        flattenedGoals.push({
          id: goal.mandalartData.id,
          text: goal.mandalartData.text,
          type: "main",
          description: goal.mandalartData.description || "",
          completed: goal.mandalartData.completed || false,
        });

        // Sub-goals
        if (goal.mandalartData.subGoals) {
          goal.mandalartData.subGoals.forEach((subGoal) => {
            if (subGoal && subGoal.text) {
              flattenedGoals.push({
                id: subGoal.id,
                text: subGoal.text,
                type: "sub",
                parentId: goal.mandalartData.id,
                description: subGoal.description || "",
                completed: subGoal.completed || false,
              });

              // Sub-sub-goals
              if (subGoal.subGoals) {
                subGoal.subGoals.forEach((subSubGoal) => {
                  if (subSubGoal && subSubGoal.text) {
                    flattenedGoals.push({
                      id: subSubGoal.id,
                      text: subSubGoal.text,
                      type: "sub-sub",
                      parentId: subGoal.id,
                      grandParentId: goal.mandalartData.id,
                      description: subSubGoal.description || "",
                      completed: subSubGoal.completed || false,
                    });
                  }
                });
              }
            }
          });
        }
      }
    });

    // Create goals context for GPT with clear hierarchy
    const goalsContext = flattenedGoals
      .map((goal) => {
        let prefix = "";
        if (goal.type === "main") prefix = "MAIN GOAL";
        else if (goal.type === "sub") prefix = "  SUB GOAL";
        else if (goal.type === "sub-sub") prefix = "    SUB-SUB GOAL";

        return `${prefix}: "${goal.text}" (ID: ${goal.id})${
          goal.description ? ` - ${goal.description}` : ""
        }`;
      })
      .join("\n");

    const systemPrompt = `You are a helpful assistant that converts conversations into personal diary entries and matches them to user goals.

User's Goals (hierarchical structure):
${goalsContext}

IMPORTANT: When matching goals, prefer the most specific match. For example:
- If the conversation is about "tennis", match the SUB-SUB GOAL "tennis" (not the SUB GOAL "exercise")
- If the conversation is about "running", match the SUB-SUB GOAL "run" (not the SUB GOAL "exercise")
- Only match the SUB GOAL if there's no specific SUB-SUB GOAL that fits

IMPORTANT RULES:
- ONLY use the actual conversation content provided below
- DO NOT add, invent, or assume any information not mentioned in the conversation
- DO NOT make up details, feelings, or experiences that weren't explicitly shared
- Base the diary entry strictly on what the user actually said
- Create a natural, flowing diary entry that feels personal and reflective
- Use first person perspective ("I", "me", "my")
- Make it sound like a real diary entry, not a formal report
- Include the user's actual words and experiences naturally
- If the conversation is brief, expand it thoughtfully while staying true to the content

After creating the diary entry, analyze if it relates to any of the user's goals and return both the diary content and goal mapping.

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON.

Your response must start with { and end with }. No other text allowed.

Return your response in this exact JSON format:
{
  "diaryContent": "the diary entry content here",
  "goalMapping": {
    "relatedGoalId": "goal-id-if-found-or-null",
    "relatedGoalType": "main-or-sub-or-sub-sub-or-null",
    "confidence": 0.0-1.0,
    "reason": "brief explanation of why this goal was matched or why no match was found"
  }
}

WARNING: If you include any text before or after the JSON, the system will fail to parse your response.

Only match goals if confidence is above 0.3. Be conservative - it's better to not match than to match incorrectly.`;

    // Check if OpenAI API key is available
    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "your_openai_api_key_here"
    ) {
      return res.status(500).json({
        error:
          "OpenAI API key not configured. Please contact the administrator to set up the API key.",
      });
    }

    const response = await fetch(
      process.env.OPENAI_API_URL ||
        "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: conversationText },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();
    console.log("GPT API response:", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid GPT API response structure:", data);
      return res.json({
        diaryContent: `Dear Diary,\n\n${conversationText}\n\nYours truly,\n[User]`,
        goalMapping: {
          relatedGoalId: null,
          relatedGoalType: null,
          confidence: 0,
          reason: "Invalid AI response structure",
        },
      });
    }

    const aiResponse = data.choices[0].message.content;
    console.log("AI response content:", aiResponse);

    try {
      // Extract JSON from response if there's extra text
      let jsonString = aiResponse.trim();

      // Find JSON object in the response
      const jsonStart = jsonString.indexOf("{");
      const jsonEnd = jsonString.lastIndexOf("}");

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
      }

      const analysis = JSON.parse(jsonString);
      console.log("Parsed analysis:", analysis);
      res.json(analysis);
    } catch (parseError) {
      console.error("Failed to parse GPT response:", aiResponse);
      res.json({
        diaryContent: `Dear Diary,\n\n${conversationText}\n\nYours truly,\n[User]`,
        goalMapping: {
          relatedGoalId: null,
          relatedGoalType: null,
          confidence: 0,
          reason: "Failed to parse AI analysis",
        },
      });
    }
  } catch (error) {
    console.error("Convert to diary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GPT-based Goal Mapping API
app.post("/api/analyze-goal-mapping", authenticateToken, async (req, res) => {
  try {
    const { diaryContent } = req.body;

    if (!diaryContent) {
      return res.status(400).json({ error: "Diary content is required" });
    }

    // Get all goals structure
    const goals = await Goal.find({ userId: req.user.userId });
    const flattenedGoals = [];

    goals.forEach((goal) => {
      if (goal.mandalartData) {
        // Main goal
        flattenedGoals.push({
          id: goal.mandalartData.id,
          text: goal.mandalartData.text,
          type: "main",
          description: goal.mandalartData.description || "",
          completed: goal.mandalartData.completed || false,
        });

        // Sub-goals
        if (goal.mandalartData.subGoals) {
          goal.mandalartData.subGoals.forEach((subGoal) => {
            if (subGoal && subGoal.text) {
              flattenedGoals.push({
                id: subGoal.id,
                text: subGoal.text,
                type: "sub",
                parentId: goal.mandalartData.id,
                description: subGoal.description || "",
                completed: subGoal.completed || false,
              });

              // Sub-sub-goals
              if (subGoal.subGoals) {
                subGoal.subGoals.forEach((subSubGoal) => {
                  if (subSubGoal && subSubGoal.text) {
                    flattenedGoals.push({
                      id: subSubGoal.id,
                      text: subSubGoal.text,
                      type: "sub-sub",
                      parentId: subGoal.id,
                      grandParentId: goal.mandalartData.id,
                      description: subSubGoal.description || "",
                      completed: subSubGoal.completed || false,
                    });
                  }
                });
              }
            }
          });
        }
      }
    });

    if (flattenedGoals.length === 0) {
      return res.json({
        relatedGoalId: null,
        relatedGoalType: null,
        confidence: 0,
        reason: "No goals found",
      });
    }

    // Create goals context for GPT
    const goalsContext = flattenedGoals
      .map(
        (goal) =>
          `- ${goal.type.toUpperCase()}: "${goal.text}" (ID: ${goal.id})${
            goal.description ? ` - ${goal.description}` : ""
          }`
      )
      .join("\n");

    const systemPrompt = `You are an AI assistant that analyzes diary entries and matches them to user goals.

User's Goals:
${goalsContext}

Analyze the following diary content and determine if it relates to any of the user's goals. Consider:
1. Direct mentions of goal topics
2. Related activities or progress
3. Emotional connections to goals
4. Indirect references to goal themes

Return your analysis in this exact JSON format:
{
  "relatedGoalId": "goal-id-if-found-or-null",
  "relatedGoalType": "main-or-sub-or-sub-sub-or-null",
  "confidence": 0.0-1.0,
  "reason": "brief explanation of why this goal was matched or why no match was found"
}

Only match if confidence is above 0.3. Be conservative - it's better to not match than to match incorrectly.`;

    // Check if OpenAI API key is available
    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "your_openai_api_key_here"
    ) {
      return res.status(500).json({
        error:
          "OpenAI API key not configured. Please contact the administrator to set up the API key.",
      });
    }

    const response = await fetch(
      process.env.OPENAI_API_URL ||
        "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: diaryContent },
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      }
    );

    const data = await response.json();
    console.log("GPT API response:", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid GPT API response structure:", data);
      return res.json({
        relatedGoalId: null,
        relatedGoalType: null,
        confidence: 0,
        reason: "Invalid AI response structure",
      });
    }

    const aiResponse = data.choices[0].message.content;
    console.log("AI response content:", aiResponse);

    try {
      const analysis = JSON.parse(aiResponse);
      console.log("Parsed analysis:", analysis);
      res.json(analysis);
    } catch (parseError) {
      console.error("Failed to parse GPT response:", aiResponse);
      res.json({
        relatedGoalId: null,
        relatedGoalType: null,
        confidence: 0,
        reason: "Failed to parse AI analysis",
      });
    }
  } catch (error) {
    console.error("Goal mapping analysis error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Chat Routes
app.get("/api/chat", authenticateToken, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ userId: req.user.userId }).sort(
      { updatedAt: -1 }
    );
    res.json(session || { messages: [] });
  } catch (error) {
    console.error("Get chat session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/chat", authenticateToken, async (req, res) => {
  try {
    const { messages } = req.body;

    let session = await ChatSession.findOne({ userId: req.user.userId });

    if (session) {
      session.messages = messages;
      session.updatedAt = new Date();
    } else {
      session = new ChatSession({
        userId: req.user.userId,
        messages,
      });
    }

    await session.save();
    res.json({ message: "Chat session saved successfully", session });
  } catch (error) {
    console.error("Save chat session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all goals with full structure for GPT analysis
app.get("/api/goals/full-structure", authenticateToken, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.userId });

    // Flatten all goals and sub-goals for easier analysis
    const flattenedGoals = [];

    goals.forEach((goal) => {
      if (goal.mandalartData) {
        // Main goal
        flattenedGoals.push({
          id: goal.mandalartData.id,
          text: goal.mandalartData.text,
          type: "main",
          description: goal.mandalartData.description || "",
          completed: goal.mandalartData.completed || false,
        });

        // Sub-goals
        if (goal.mandalartData.subGoals) {
          goal.mandalartData.subGoals.forEach((subGoal) => {
            if (subGoal && subGoal.text) {
              flattenedGoals.push({
                id: subGoal.id,
                text: subGoal.text,
                type: "sub",
                parentId: goal.mandalartData.id,
                description: subGoal.description || "",
                completed: subGoal.completed || false,
              });

              // Sub-sub-goals
              if (subGoal.subGoals) {
                subGoal.subGoals.forEach((subSubGoal) => {
                  if (subSubGoal && subSubGoal.text) {
                    flattenedGoals.push({
                      id: subSubGoal.id,
                      text: subSubGoal.text,
                      type: "sub-sub",
                      parentId: subGoal.id,
                      grandParentId: goal.mandalartData.id,
                      description: subSubGoal.description || "",
                      completed: subSubGoal.completed || false,
                    });
                  }
                });
              }
            }
          });
        }
      }
    });

    res.json(flattenedGoals);
  } catch (error) {
    console.error("Get full goals structure error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// AI assistant for goal suggestions (Mandalart)
app.post("/api/goals/ai-suggestions", authenticateToken, async (req, res) => {
  try {
    const { description, dueDate } = req.body;

    if (!description || !description.trim()) {
      return res
        .status(400)
        .json({ error: "Goal description is required for AI suggestions." });
    }

    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "your_openai_api_key_here"
    ) {
      return res.status(500).json({
        error:
          "OpenAI API key not configured. Please contact the administrator to set up the API key.",
      });
    }

    const systemPrompt = `You are a personal goal-setting coach specializing in the Mandalart method. A Mandalart breaks a main goal into 8 primary objectives, and each primary objective into 8 secondary objectives.

The user will provide a goal description. Your task is to:
1. Rephrase the user's goal into a clear, concise main goal for the central square.
2. Suggest 8 distinct, actionable primary objectives that directly contribute to the main goal.
3. Format your response clearly, with the main goal first, followed by the 8 primary objectives. Use bullet points for objectives.`;

    const userPrompt = `Help me break down this goal into a Mandalart: "${description.trim()}"${
      dueDate
        ? ` with a due date of ${new Date(dueDate).toLocaleDateString()}`
        : ""
    }`;

    const response = await fetch(
      process.env.OPENAI_API_URL ||
        "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      console.error("Goal suggestion API failed:", response.status, response.statusText);
      return res
        .status(500)
        .json({ error: "Failed to generate AI goal suggestions." });
    }

    const data = await response.json();
    const suggestion = data?.choices?.[0]?.message?.content;

    if (!suggestion) {
      return res
        .status(500)
        .json({ error: "AI did not return a suggestion. Please try again." });
    }

    res.json({ suggestion });
  } catch (error) {
    console.error("Goal AI suggestion error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while generating suggestions." });
  }
});

// Enhanced Chat API with goal context
app.post("/api/chat/enhanced", authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    // Get user's goals and recent progress for context
    const goals = await Goal.find({ userId: req.user.userId });
    const recentProgress = await GoalProgress.find({
      userId: req.user.userId,
    })
      .sort({ date: -1 })
      .limit(5);

    // Build goal context with progress information
    let goalContext = "";
    if (goals.length > 0) {
      goalContext = "\n\nUser's current goals and recent progress:\n";
      for (const goal of goals) {
        goalContext += `- Main Goal: ${goal.mandalartData.text}\n`;
        if (goal.mandalartData.completed) {
          goalContext += `  ✅ COMPLETED!\n`;
        }

        // Get recent progress for this goal
        const goalProgress = recentProgress.filter(
          (p) => p.goalId === goal.mandalartData.id
        );
        if (goalProgress.length > 0) {
          goalContext += `  Recent progress:\n`;
          goalProgress.slice(0, 3).forEach((progress) => {
            goalContext += `    • ${
              progress.title
            } (${progress.date.toLocaleDateString()})\n`;
          });
        }

        // Check sub-goals
        if (Array.isArray(goal.mandalartData.subGoals)) {
          const validSubGoals = goal.mandalartData.subGoals.filter(
            (sg) => sg && sg.text
          );
          if (validSubGoals.length > 0) {
            const completedSubGoals = validSubGoals.filter(
              (sg) => sg.completed
            ).length;
            goalContext += `  Sub-goals progress: ${completedSubGoals}/${validSubGoals.length} completed\n`;
          }
        }
        goalContext += "\n";
      }
    }

    const systemPrompt = `You are a helpful and supportive AI assistant for a personal reflection and goal-setting app called Reflecta. 
    Your role is to help users reflect on their thoughts, feelings, and experiences, and provide gentle guidance for personal growth.
    Be empathetic, encouraging, and non-judgmental. Ask thoughtful questions to help users explore their thoughts more deeply.
    Keep responses concise but meaningful.
    
    IMPORTANT: When users mention progress or achievements related to their goals, celebrate their success! 
    Acknowledge their hard work and encourage them to continue. If they've completed goals or made significant progress, 
    be enthusiastic and supportive.${goalContext}`;

    const response = await fetch(
      process.env.OPENAI_API_URL ||
        "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // Save to chat session
    let session = await ChatSession.findOne({ userId: req.user.userId });
    if (!session) {
      session = new ChatSession({ userId: req.user.userId, messages: [] });
    }

    session.messages.push(
      {
        id: `user-${Date.now()}`,
        text: message,
        sender: "user",
        timestamp: new Date(),
      },
      {
        id: `bot-${Date.now()}`,
        text: aiMessage,
        sender: "bot",
        timestamp: new Date(),
      }
    );

    await session.save();

    res.json({ message: aiMessage });
  } catch (error) {
    console.error("Enhanced chat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// AI Progress Summary endpoint
app.get(
  "/api/goals/:goalId/ai-summary",
  authenticateToken,
  async (req, res) => {
    try {
      const { goalId } = req.params;
      const period = req.query.period || "weekly";

      // Get goal progress data
      const { start, end } = getPeriodBounds(period);
      const progressEntries = await GoalProgress.find({
        userId: req.user.userId,
        goalId,
        date: { $gte: start, $lte: end },
      }).sort({ date: -1 });

      // Get related journal entries
      const journalEntries = await JournalEntry.find({
        userId: req.user.userId,
        relatedGoalId: goalId,
        date: { $gte: start, $lte: end },
      }).sort({ date: -1 });

      // Prepare context for AI
      const progressSummary = progressEntries
        .map(
          (p) =>
            `${p.date.toLocaleDateString()}: ${p.title} - ${p.description}`
        )
        .join("\n");

      const journalSummary = journalEntries
        .slice(0, 5)
        .map((j) => `${j.date.toLocaleDateString()}: ${j.content.substring(0, 200)}...`)
        .join("\n");

      const prompt = `You are a personal growth coach analyzing a user's progress on their goal.

Period: ${period}
Progress Entries (${progressEntries.length}):
${progressSummary || "No progress entries yet"}

Related Journal Entries (${journalEntries.length}):
${journalSummary || "No journal entries yet"}

Please provide:
1. A brief, encouraging summary of their progress (2-3 sentences)
2. Key achievements this period (bullet points)
3. Areas for improvement (bullet points)
4. Recommended next steps (bullet points)

Format your response as JSON:
{
  "summary": "...",
  "achievements": ["...", "..."],
  "improvements": ["...", "..."],
  "nextSteps": ["...", "..."]
}`;

      const response = await fetch(process.env.OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      const aiSummary = JSON.parse(data.choices[0].message.content);

      res.json({
        ...aiSummary,
        stats: {
          progressCount: progressEntries.length,
          journalCount: journalEntries.length,
          period,
        },
      });
    } catch (error) {
      console.error("AI summary error:", error);
      res.status(500).json({ error: "Failed to generate AI summary" });
    }
  }
);

// Word Cloud data endpoint
app.get(
  "/api/goals/:goalId/wordcloud",
  authenticateToken,
  async (req, res) => {
    try {
      const { goalId } = req.params;
      const period = req.query.period || "weekly";

      const { start, end } = getPeriodBounds(period);

      // Get progress entries and journal entries
      const progressEntries = await GoalProgress.find({
        userId: req.user.userId,
        goalId,
        date: { $gte: start, $lte: end },
      });

      const journalEntries = await JournalEntry.find({
        userId: req.user.userId,
        relatedGoalId: goalId,
        date: { $gte: start, $lte: end },
      });

      // Combine all text
      const allText =
        progressEntries.map((p) => `${p.title} ${p.description}`).join(" ") +
        " " +
        journalEntries.map((j) => j.content).join(" ");

      // Simple word frequency analysis (remove common words)
      const stopWords = new Set([
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "with",
        "by",
        "from",
        "as",
        "is",
        "was",
        "are",
        "were",
        "been",
        "be",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "should",
        "could",
        "may",
        "might",
        "can",
        "my",
        "your",
        "his",
        "her",
        "its",
        "our",
        "their",
        "this",
        "that",
        "these",
        "those",
        "i",
        "you",
        "he",
        "she",
        "it",
        "we",
        "they",
      ]);

      const words = allText
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((word) => word.length > 3 && !stopWords.has(word));

      const wordFreq = {};
      words.forEach((word) => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });

      // Convert to array and sort
      const wordCloudData = Object.entries(wordFreq)
        .map(([text, value]) => ({ text, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 50); // Top 50 words

      res.json({ words: wordCloudData });
    } catch (error) {
      console.error("Word cloud error:", error);
      res.status(500).json({ error: "Failed to generate word cloud" });
    }
  }
);

// Progress Chart data endpoint
app.get(
  "/api/goals/:goalId/chart-data",
  authenticateToken,
  async (req, res) => {
    try {
      const { goalId } = req.params;
      const period = req.query.period || "weekly";

      const { start, end } = getPeriodBounds(period);

      const progressEntries = await GoalProgress.find({
        userId: req.user.userId,
        goalId,
        date: { $gte: start, $lte: end },
      }).sort({ date: 1 });

      // Group by date
      const dailyData = {};
      progressEntries.forEach((entry) => {
        const dateKey = entry.date.toISOString().split("T")[0];
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            date: dateKey,
            count: 0,
            timeSpent: 0,
            entries: [],
          };
        }
        dailyData[dateKey].count += 1;
        dailyData[dateKey].timeSpent += entry.timeSpent || 0;
        dailyData[dateKey].entries.push(entry);
      });

      const chartData = Object.values(dailyData).map((day) => ({
        date: day.date,
        count: day.count,
        timeSpent: day.timeSpent,
        avgMood: day.entries.reduce((acc, e) => acc + (e.mood === "happy" ? 5 : e.mood === "excited" ? 4 : e.mood === "calm" ? 3 : e.mood === "neutral" ? 2 : 1), 0) / day.entries.length,
      }));

      res.json({ chartData, period });
    } catch (error) {
      console.error("Chart data error:", error);
      res.status(500).json({ error: "Failed to generate chart data" });
    }
  }
);

// ============================================================================
// PRIVACY SETTINGS & COUNSELOR DASHBOARD ENDPOINTS
// ============================================================================

// Get current user's privacy settings
app.get("/api/privacy-settings", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("privacySettings role");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      privacySettings: user.privacySettings || {},
      role: user.role,
    });
  } catch (error) {
    console.error("Privacy settings fetch error:", error);
    res.status(500).json({ error: "Failed to fetch privacy settings" });
  }
});

// Update privacy settings (students only)
app.put("/api/privacy-settings", authenticateToken, async (req, res) => {
  try {
    const { riskMonitoring, assignedCounselors } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only students can update privacy settings
    if (user.role !== "student") {
      return res.status(403).json({
        error: "Only students can update privacy settings",
      });
    }

    // Update privacy settings
    if (riskMonitoring !== undefined) {
      user.privacySettings = user.privacySettings || {};
      user.privacySettings.riskMonitoring = {
        enabled: riskMonitoring.enabled,
        shareLevel: riskMonitoring.shareLevel || "summary",
        consentDate: riskMonitoring.enabled ? new Date() : user.privacySettings.riskMonitoring?.consentDate,
      };
    }

    if (assignedCounselors !== undefined) {
      user.privacySettings = user.privacySettings || {};
      user.privacySettings.assignedCounselors = assignedCounselors;
    }

    await user.save();

    res.json({
      message: "Privacy settings updated successfully",
      privacySettings: user.privacySettings,
    });
  } catch (error) {
    console.error("Privacy settings update error:", error);
    res.status(500).json({ error: "Failed to update privacy settings" });
  }
});

// Get list of available counselors (for student to select)
app.get("/api/counselors", authenticateToken, async (req, res) => {
  try {
    const counselors = await User.find({ role: "counselor" })
      .select("name email counselorProfile")
      .lean();

    res.json({ counselors });
  } catch (error) {
    console.error("Counselors fetch error:", error);
    res.status(500).json({ error: "Failed to fetch counselors" });
  }
});

// Get risk alerts for counselor dashboard
app.get(
  "/api/counselor/alerts",
  authenticateToken,
  requireRole("counselor"),
  async (req, res) => {
    try {
      const { status, riskLevel, limit = 50, offset = 0 } = req.query;

      // Build query - all counselors can see all alerts
      const query = {};

      if (status) {
        query.status = status;
      }

      if (riskLevel) {
        query.riskLevel = riskLevel;
      }

      // Fetch alerts
      const alerts = await RiskAlert.find(query)
        .populate("studentId", "name email studentProfile")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .lean();

      // Get total count
      const total = await RiskAlert.countDocuments(query);

      // Get statistics - all alerts
      const stats = await RiskAlert.aggregate([
        {
          $match: {},
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            new: {
              $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] },
            },
            critical: {
              $sum: { $cond: [{ $eq: ["$riskLevel", "critical"] }, 1, 0] },
            },
            high: {
              $sum: { $cond: [{ $eq: ["$riskLevel", "high"] }, 1, 0] },
            },
            medium: {
              $sum: { $cond: [{ $eq: ["$riskLevel", "medium"] }, 1, 0] },
            },
            low: {
              $sum: { $cond: [{ $eq: ["$riskLevel", "low"] }, 1, 0] },
            },
          },
        },
      ]);

      res.json({
        alerts,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
        stats: stats[0] || {
          total: 0,
          new: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      });
    } catch (error) {
      console.error("Counselor alerts fetch error:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  }
);

// Get specific alert details
app.get(
  "/api/counselor/alerts/:alertId",
  authenticateToken,
  requireRole("counselor"),
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const counselorId = req.user.userId;

      const alert = await RiskAlert.findOne({
        _id: alertId,
        "assignedCounselors.counselorId": counselorId,
      })
        .populate("studentId", "name email studentProfile")
        .populate("assignedCounselors.counselorId", "name email")
        .populate("counselorNotes.counselorId", "name")
        .lean();

      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      res.json({ alert });
    } catch (error) {
      console.error("Alert fetch error:", error);
      res.status(500).json({ error: "Failed to fetch alert" });
    }
  }
);

// Update alert status
app.patch(
  "/api/counselor/alerts/:alertId/status",
  authenticateToken,
  requireRole("counselor"),
  canModifyAlert,
  async (req, res) => {
    try {
      const { status, followUpDate } = req.body;

      const alert = req.alert;

      if (status) {
        alert.status = status;
      }

      if (followUpDate) {
        alert.followUpDate = new Date(followUpDate);
      }

      if (status === "resolved") {
        alert.resolvedAt = new Date();
      }

      await alert.save();

      res.json({
        message: "Alert status updated",
        alert,
      });
    } catch (error) {
      console.error("Alert status update error:", error);
      res.status(500).json({ error: "Failed to update alert status" });
    }
  }
);

// Add counselor note to alert
app.post(
  "/api/counselor/alerts/:alertId/notes",
  authenticateToken,
  requireRole("counselor"),
  canModifyAlert,
  async (req, res) => {
    try {
      const { note, action } = req.body;

      if (!note) {
        return res.status(400).json({ error: "Note is required" });
      }

      const alert = req.alert;

      alert.counselorNotes.push({
        counselorId: req.user.userId,
        note,
        action,
        createdAt: new Date(),
      });

      await alert.save();

      res.json({
        message: "Note added successfully",
        alert,
      });
    } catch (error) {
      console.error("Add note error:", error);
      res.status(500).json({ error: "Failed to add note" });
    }
  }
);

// Get student overview for counselor (with privacy filtering)
app.get(
  "/api/counselor/students/:studentId",
  authenticateToken,
  requireRole("counselor"),
  canAccessStudent,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const shareLevel = req.student.shareLevel;

      // Fetch student info
      const student = await User.findById(studentId)
        .select("name email studentProfile createdAt")
        .lean();

      // Fetch recent alerts
      const recentAlerts = await RiskAlert.find({
        studentId,
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Fetch mood trend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let moodTrend = null;
      let journalCount = 0;

      if (shareLevel === "moderate" || shareLevel === "detailed") {
        const journals = await JournalEntry.find({
          userId: studentId,
          date: { $gte: thirtyDaysAgo },
        })
          .select("mood date")
          .sort({ date: 1 })
          .lean();

        journalCount = journals.length;

        // Calculate mood trend
        const moodScores = {
          happy: 5,
          excited: 5,
          grateful: 4,
          calm: 4,
          neutral: 3,
          reflective: 3,
          anxious: 2,
          sad: 1,
        };

        const scores = journals.map((j) => moodScores[j.mood] || 3);
        const avgScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null;

        moodTrend = {
          averageScore: avgScore,
          totalEntries: journals.length,
          moodDistribution: journals.reduce((acc, j) => {
            acc[j.mood] = (acc[j.mood] || 0) + 1;
            return acc;
          }, {}),
        };
      }

      // Response based on share level
      const response = {
        student,
        alerts: {
          recent: recentAlerts.map((alert) => ({
            id: alert._id,
            riskLevel: alert.riskLevel,
            status: alert.status,
            createdAt: alert.createdAt,
            summary:
              shareLevel === "summary"
                ? alert.aiAnalysis.summary
                : shareLevel === "moderate"
                ? alert.aiAnalysis.summary
                : alert.aiAnalysis,
          })),
          total: recentAlerts.length,
        },
        shareLevel,
      };

      if (shareLevel === "moderate" || shareLevel === "detailed") {
        response.moodTrend = moodTrend;
        response.journalCount = journalCount;
      }

      res.json(response);
    } catch (error) {
      console.error("Student overview fetch error:", error);
      res.status(500).json({ error: "Failed to fetch student overview" });
    }
  }
);

// Trigger risk analysis for journal entry (called automatically after journal save)
app.post(
  "/api/journal/:entryId/analyze-risk",
  authenticateToken,
  async (req, res) => {
    try {
      const { entryId } = req.params;
      const userId = req.user.userId;

      // Check if risk monitoring is enabled
      const user = await User.findById(userId).select("privacySettings");
      if (!user?.privacySettings?.riskMonitoring?.enabled) {
        return res.json({
          message: "Risk monitoring not enabled",
          analyzed: false,
        });
      }

      // Trigger analysis
      const riskAlert = await riskDetectionService.analyzeJournalEntry(
        userId,
        entryId
      );

      if (riskAlert) {
        res.json({
          message: "Risk detected and alert created",
          analyzed: true,
          riskLevel: riskAlert.riskLevel,
          alertId: riskAlert._id,
        });
      } else {
        res.json({
          message: "No significant risk detected",
          analyzed: true,
        });
      }
    } catch (error) {
      console.error("Risk analysis error:", error);
      res.status(500).json({ error: "Failed to analyze risk" });
    }
  }
);

// Trigger mood pattern analysis (can be called periodically via cron)
app.post(
  "/api/analyze-mood-patterns",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;

      // Check if risk monitoring is enabled
      const user = await User.findById(userId).select("privacySettings");
      if (!user?.privacySettings?.riskMonitoring?.enabled) {
        return res.json({
          message: "Risk monitoring not enabled",
          analyzed: false,
        });
      }

      // Trigger analysis
      const riskAlert = await riskDetectionService.analyzeMoodPattern(userId);

      if (riskAlert) {
        res.json({
          message: "Risk pattern detected and alert created",
          analyzed: true,
          riskLevel: riskAlert.riskLevel,
          alertId: riskAlert._id,
        });
      } else {
        res.json({
          message: "No concerning patterns detected",
          analyzed: true,
        });
      }
    } catch (error) {
      console.error("Mood pattern analysis error:", error);
      res.status(500).json({ error: "Failed to analyze mood patterns" });
    }
  }
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
