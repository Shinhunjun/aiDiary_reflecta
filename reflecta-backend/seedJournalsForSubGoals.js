const mongoose = require('mongoose');

const uri = "mongodb+srv://jun:970213@cluster0.ce0oj.mongodb.net/reflecta?retryWrites=true&w=majority&appName=Cluster0";

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
});

const goalSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  mandalartData: mongoose.Schema.Types.Mixed,
});

const journalSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  title: String,
  content: String,
  mood: String,
  tags: [String],
  date: Date,
  isAIGenerated: Boolean,
  relatedGoalId: String,
  relatedGoalType: String,
});

const User = mongoose.model('User', userSchema);
const Goal = mongoose.model('Goal', goalSchema);
const JournalEntry = mongoose.model('JournalEntry', journalSchema);

const journalTemplates = [
  {
    moods: ['excited', 'happy', 'grateful'],
    templates: [
      "Today I made significant progress on {goal}. I successfully completed the first milestone and feel really motivated. The approach I'm taking seems to be working well.",
      "Great breakthrough today with {goal}! Everything is starting to click into place. I can see how all the pieces connect now, which is incredibly satisfying.",
      "Feeling accomplished after working on {goal} today. I overcame a major challenge that had been blocking me for a while. Really proud of the progress.",
      "Today was productive for {goal}. I learned some new techniques and applied them successfully. Looking forward to building on this momentum tomorrow."
    ]
  },
  {
    moods: ['calm', 'reflective', 'neutral'],
    templates: [
      "Steady progress on {goal} today. Nothing dramatic, but consistent effort is paying off. Taking time to reflect on what I've learned so far.",
      "Working methodically on {goal}. Some parts are easier than expected, others more challenging. Overall feeling balanced about the journey.",
      "Made some headway with {goal} today. It's interesting to see how my understanding evolves with each session. Patience is key.",
      "Today I focused on the fundamentals of {goal}. Sometimes it's important to slow down and ensure the foundation is solid."
    ]
  },
  {
    moods: ['anxious', 'sad'],
    templates: [
      "Struggled a bit with {goal} today. Hit some roadblocks that are frustrating. Need to take a step back and reassess my approach tomorrow.",
      "Feeling challenged by {goal}. The complexity is higher than I anticipated. Will need to break it down into smaller, more manageable pieces.",
      "Today was tough for {goal}. Not seeing the progress I hoped for. Maybe I need to seek some guidance or try a different strategy.",
      "Having doubts about my progress with {goal}. Some aspects are proving more difficult than expected. Need to stay patient and persistent."
    ]
  }
];

function getRandomTemplate(goalText) {
  const category = journalTemplates[Math.floor(Math.random() * journalTemplates.length)];
  const template = category.templates[Math.floor(Math.random() * category.templates.length)];
  const mood = category.moods[Math.floor(Math.random() * category.moods.length)];

  return {
    content: template.replace('{goal}', goalText),
    mood: mood
  };
}

function getRandomDate(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

async function seedJournals() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas\n');

    // Find test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('Test user not found');
      return;
    }
    console.log('Found test user:', testUser.name);

    // Get user's goals
    const goals = await Goal.find({ userId: testUser._id });
    if (goals.length === 0) {
      console.log('No goals found for test user');
      return;
    }

    console.log('Found', goals.length, 'goal package(s)\n');

    // Collect all sub-sub-goals
    const subSubGoals = [];
    const subGoals = [];

    goals.forEach(goalPackage => {
      const mandalart = goalPackage.mandalartData;

      if (mandalart && mandalart.subGoals) {
        mandalart.subGoals.forEach(subGoal => {
          if (subGoal && subGoal.text) {
            subGoals.push({
              id: subGoal.id,
              text: subGoal.text,
              type: 'sub'
            });

            if (subGoal.subGoals) {
              subGoal.subGoals.forEach(subSubGoal => {
                if (subSubGoal && subSubGoal.text) {
                  subSubGoals.push({
                    id: subSubGoal.id,
                    text: subSubGoal.text,
                    parentId: subGoal.id,
                    type: 'sub-sub'
                  });
                }
              });
            }
          }
        });
      }
    });

    console.log('Found', subGoals.length, 'sub-goals');
    console.log('Found', subSubGoals.length, 'sub-sub-goals\n');

    if (subSubGoals.length === 0) {
      console.log('No sub-sub-goals found to create journals for');
      return;
    }

    // Generate 2-4 journal entries for each sub-sub-goal
    const journalsToCreate = [];

    subSubGoals.forEach((goal, index) => {
      const numEntries = 2 + Math.floor(Math.random() * 3); // 2-4 entries

      console.log(`${index + 1}. ${goal.text} (${goal.id}) - Creating ${numEntries} entries`);

      for (let i = 0; i < numEntries; i++) {
        const template = getRandomTemplate(goal.text);

        journalsToCreate.push({
          userId: testUser._id,
          title: `Progress on ${goal.text} - Entry ${i + 1}`,
          content: template.content,
          mood: template.mood,
          tags: ['goal-progress', 'learning', 'development'],
          date: getRandomDate(60), // Random date within last 60 days
          isAIGenerated: false,
          relatedGoalId: goal.id,
          relatedGoalType: goal.type,
        });
      }
    });

    console.log(`\nTotal journals to create: ${journalsToCreate.length}`);
    console.log('Creating journal entries...');

    // Insert all journals
    const result = await JournalEntry.insertMany(journalsToCreate);

    console.log(`\n✅ Successfully created ${result.length} journal entries!`);

    // Show summary by sub-goal
    console.log('\n📊 Summary by Sub-Goal:');
    const grouped = {};
    subSubGoals.forEach(goal => {
      if (!grouped[goal.parentId]) {
        const parent = subGoals.find(sg => sg.id === goal.parentId);
        grouped[goal.parentId] = {
          name: parent ? parent.text : 'Unknown',
          count: 0
        };
      }
      const count = journalsToCreate.filter(j => j.relatedGoalId === goal.id).length;
      grouped[goal.parentId].count += count;
    });

    Object.values(grouped).forEach(g => {
      console.log(`  ${g.name}: ${g.count} entries`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seedJournals();
