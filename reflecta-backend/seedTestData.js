const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const User = require("./models/User");
const Goal = require("./models/Goal");
const GoalProgress = require("./models/GoalProgress");
const JournalEntry = require("./models/JournalEntry");

// Connect to MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected to:", uri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// Create test user or get existing
const createTestUser = async () => {
  try {
    let user = await User.findOne({ email: "test@example.com" });

    if (user) {
      console.log("✅ Test user already exists:", user.email);
      return user;
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("test123", 10);

    user = new User({
      email: "test@example.com",
      password: hashedPassword,
      name: "Test User",
      role: "student",
      studentProfile: {
        studentId: "2024001",
        grade: "3",
        major: "Computer Science",
        enrollmentYear: 2022,
      },
    });

    await user.save();
    console.log("✅ Test user created:", user.email);
    return user;
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    throw error;
  }
};

// Create Mandalart goals
const createGoals = async (userId) => {
  try {
    // Check if goals already exist
    const existingGoal = await Goal.findOne({ userId });
    if (existingGoal) {
      console.log("✅ Goals already exist for user");
      return existingGoal;
    }

    const mandalartData = {
      id: "main-center",
      text: "Become a Successful Full-Stack Developer",
      completed: false,
      description: "Master modern web development and build innovative applications",
      dueDate: new Date("2025-12-31"),
      subGoals: [
        {
          id: "goal-1",
          text: "Master Frontend Development",
          completed: true,
          description: "React, Vue, and modern CSS",
          dueDate: new Date("2025-06-30"),
          subGoals: [
            { id: "goal-1-1", text: "Learn React Hooks", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-1-2", text: "Master State Management", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-1-3", text: "Learn TypeScript", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-1-4", text: "Build Portfolio Projects", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-1-5", text: "Learn Testing (Jest/React Testing Library)", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-1-6", text: "Master CSS/Tailwind", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-1-7", text: "Learn Next.js", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-1-8", text: "Performance Optimization", completed: false, description: "", dueDate: null, subGoals: [] },
          ],
        },
        {
          id: "goal-2",
          text: "Master Backend Development",
          completed: false,
          description: "Node.js, databases, and APIs",
          dueDate: new Date("2025-08-31"),
          subGoals: [
            { id: "goal-2-1", text: "Learn Node.js & Express", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-2-2", text: "Master MongoDB", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-2-3", text: "Learn PostgreSQL", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-2-4", text: "RESTful API Design", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-2-5", text: "Authentication & Security", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-2-6", text: "Learn GraphQL", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-2-7", text: "Microservices Architecture", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-2-8", text: "API Documentation", completed: true, description: "", dueDate: null, subGoals: [] },
          ],
        },
        {
          id: "goal-3",
          text: "Learn Cloud & DevOps",
          completed: false,
          description: "AWS, Docker, CI/CD",
          dueDate: new Date("2025-09-30"),
          subGoals: [
            { id: "goal-3-1", text: "Learn Docker", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-3-2", text: "Kubernetes Basics", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-3-3", text: "AWS Services (EC2, S3, RDS)", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-3-4", text: "CI/CD with GitHub Actions", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-3-5", text: "Monitoring & Logging", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-3-6", text: "Infrastructure as Code", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-3-7", text: "Cloud Cost Optimization", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-3-8", text: "Security Best Practices", completed: false, description: "", dueDate: null, subGoals: [] },
          ],
        },
        {
          id: "goal-4",
          text: "Build Portfolio Projects",
          completed: false,
          description: "Create impressive real-world applications",
          dueDate: new Date("2025-10-31"),
          subGoals: [
            { id: "goal-4-1", text: "E-commerce Platform", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-4-2", text: "Social Media App", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-4-3", text: "Real-time Chat Application", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-4-4", text: "Task Management System", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-4-5", text: "Blog Platform with CMS", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-4-6", text: "Analytics Dashboard", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-4-7", text: "Mobile App (React Native)", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-4-8", text: "Open Source Contribution", completed: false, description: "", dueDate: null, subGoals: [] },
          ],
        },
        null, // Center position (goal-5 is skipped)
        {
          id: "goal-6",
          text: "Improve Soft Skills",
          completed: false,
          description: "Communication and teamwork",
          dueDate: new Date("2025-12-31"),
          subGoals: [
            { id: "goal-6-1", text: "Technical Writing", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-6-2", text: "Public Speaking", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-6-3", text: "Team Collaboration", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-6-4", text: "Code Review Skills", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-6-5", text: "Mentoring Junior Developers", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-6-6", text: "Agile Methodologies", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-6-7", text: "Problem Solving", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-6-8", text: "Time Management", completed: false, description: "", dueDate: null, subGoals: [] },
          ],
        },
        {
          id: "goal-7",
          text: "Networking & Career",
          completed: false,
          description: "Build professional network",
          dueDate: new Date("2025-12-31"),
          subGoals: [
            { id: "goal-7-1", text: "LinkedIn Profile Optimization", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-7-2", text: "Attend Tech Meetups", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-7-3", text: "Conference Speaking", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-7-4", text: "Tech Blog Writing", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-7-5", text: "Build GitHub Profile", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-7-6", text: "Connect with Industry Leaders", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-7-7", text: "Join Developer Communities", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-7-8", text: "Resume & Interview Prep", completed: false, description: "", dueDate: null, subGoals: [] },
          ],
        },
        {
          id: "goal-8",
          text: "Stay Updated",
          completed: false,
          description: "Keep learning new technologies",
          dueDate: new Date("2025-12-31"),
          subGoals: [
            { id: "goal-8-1", text: "Read Tech Articles Daily", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-8-2", text: "Follow Tech Influencers", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-8-3", text: "Complete Online Courses", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-8-4", text: "Watch Conference Talks", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-8-5", text: "Experiment with New Tech", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-8-6", text: "Subscribe to Tech Newsletters", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-8-7", text: "Participate in Hackathons", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-8-8", text: "Build Side Projects", completed: true, description: "", dueDate: null, subGoals: [] },
          ],
        },
        {
          id: "goal-9",
          text: "Health & Work-Life Balance",
          completed: false,
          description: "Maintain physical and mental health",
          dueDate: new Date("2025-12-31"),
          subGoals: [
            { id: "goal-9-1", text: "Exercise 3x per Week", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-9-2", text: "Meditation Practice", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-9-3", text: "Proper Sleep Schedule", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-9-4", text: "Healthy Eating Habits", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-9-5", text: "Take Regular Breaks", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-9-6", text: "Hobby Time", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-9-7", text: "Family & Friends Time", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-9-8", text: "Digital Detox", completed: false, description: "", dueDate: null, subGoals: [] },
          ],
        },
      ],
    };

    const goal = new Goal({
      userId,
      mandalartData,
    });

    await goal.save();
    console.log("✅ Goals created successfully");
    return goal;
  } catch (error) {
    console.error("❌ Error creating goals:", error);
    throw error;
  }
};

// Create progress entries over the past 2 months
const createProgressEntries = async (userId, goalId) => {
  try {
    const existingProgress = await GoalProgress.find({ userId, goalId });
    if (existingProgress.length > 0) {
      console.log(`✅ ${existingProgress.length} progress entries already exist`);
      return;
    }

    const progressEntries = [];
    const now = new Date();
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const progressTypes = ["checkin", "milestone", "completion", "reflection"];
    const moods = ["happy", "excited", "calm", "neutral", "grateful", "reflective"];
    const difficulties = ["easy", "medium", "hard"];

    // Create 50 progress entries over 2 months
    for (let i = 0; i < 50; i++) {
      const randomDays = Math.floor(Math.random() * 60);
      const entryDate = new Date(twoMonthsAgo.getTime() + randomDays * 24 * 60 * 60 * 1000);

      const isMilestone = Math.random() > 0.85; // 15% chance of milestone
      const progressType = isMilestone ? "milestone" : progressTypes[Math.floor(Math.random() * progressTypes.length)];

      const completionPercentage = isMilestone
        ? [25, 50, 75, 100][Math.floor(Math.random() * 4)]
        : Math.floor(Math.random() * 30) + 5;

      progressEntries.push({
        userId,
        goalId,
        subGoalId: Math.random() > 0.3 ? `goal-${Math.floor(Math.random() * 9) + 1}` : null,
        progressType,
        title: isMilestone
          ? `${completionPercentage}% Milestone Achieved!`
          : `Day ${i + 1} Progress Check-in`,
        description: isMilestone
          ? `Reached ${completionPercentage}% completion! Major milestone accomplished with consistent effort.`
          : `Made solid progress today. Completed several tasks and learning objectives.`,
        date: entryDate,
        mood: moods[Math.floor(Math.random() * moods.length)],
        tags: ["development", "learning", "progress"].slice(0, Math.floor(Math.random() * 3) + 1),
        difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
        timeSpent: Math.floor(Math.random() * 180) + 30, // 30-210 minutes
        notes: "Focused work session with good productivity.",
        isMilestone,
        milestoneTitle: isMilestone ? `${completionPercentage}% Complete` : undefined,
        milestoneCategory: isMilestone
          ? completionPercentage === 25 ? "quarter"
          : completionPercentage === 50 ? "half"
          : completionPercentage === 75 ? "three-quarter"
          : completionPercentage === 100 ? "complete"
          : "custom"
          : undefined,
        completionPercentage,
        celebrationEmoji: isMilestone ? ["🎉", "🏆", "🎯", "✨", "🚀"][Math.floor(Math.random() * 5)] : undefined,
      });
    }

    await GoalProgress.insertMany(progressEntries);
    console.log(`✅ Created ${progressEntries.length} progress entries`);
  } catch (error) {
    console.error("❌ Error creating progress entries:", error);
    throw error;
  }
};

// Create journal entries
const createJournalEntries = async (userId, goalId) => {
  try {
    const existingJournals = await JournalEntry.find({ userId });
    if (existingJournals.length > 0) {
      console.log(`✅ ${existingJournals.length} journal entries already exist`);
      return;
    }

    const journalEntries = [];
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const moods = ["happy", "excited", "calm", "neutral", "grateful", "reflective"];

    for (let i = 0; i < 15; i++) {
      const randomDays = Math.floor(Math.random() * 30);
      const entryDate = new Date(oneMonthAgo.getTime() + randomDays * 24 * 60 * 60 * 1000);

      journalEntries.push({
        userId,
        title: `Day ${i + 1} - Development Journey`,
        content: `Today was productive. I made progress on my goals and learned new concepts. Feeling motivated to continue.`,
        mood: moods[Math.floor(Math.random() * moods.length)],
        tags: ["development", "learning", "reflection"],
        date: entryDate,
        relatedGoalId: Math.random() > 0.5 ? goalId : undefined,
        relatedGoalType: Math.random() > 0.5 ? "main" : "sub",
      });
    }

    await JournalEntry.insertMany(journalEntries);
    console.log(`✅ Created ${journalEntries.length} journal entries`);
  } catch (error) {
    console.error("❌ Error creating journal entries:", error);
    throw error;
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    await connectDB();

    console.log("\n🌱 Starting database seeding...\n");

    const user = await createTestUser();
    const goal = await createGoals(user._id);
    await createProgressEntries(user._id, goal.mandalartData.id);
    await createJournalEntries(user._id, goal.mandalartData.id);

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\n📝 Test Account Credentials:");
    console.log("   Email: test@example.com");
    console.log("   Password: test123");
    console.log("\n🎯 You can now test the Goal Dashboard with rich data!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

// Run the seed script
seedDatabase();
