const mongoose = require('mongoose');

// MongoDB Atlas URI
const uri = "mongodb+srv://jun:970213@cluster0.ce0oj.mongodb.net/reflecta?retryWrites=true&w=majority&appName=Cluster0";

// Define schemas
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

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
});

const JournalEntry = mongoose.model('JournalEntry', journalSchema);
const User = mongoose.model('User', userSchema);

async function checkGoalMapping() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas');

    // Find test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('Test user not found');
      return;
    }
    console.log('\n✓ Test user found:', testUser.name, '(', testUser._id, ')');

    // Get all journal entries for test user
    const entries = await JournalEntry.find({ userId: testUser._id })
      .sort({ date: -1 })
      .select('title date isAIGenerated relatedGoalId relatedGoalType')
      .lean();

    console.log('\n📊 Total journal entries:', entries.length);

    // Count entries with goal mapping
    const mappedEntries = entries.filter(e => e.relatedGoalId);
    const unmappedEntries = entries.filter(e => !e.relatedGoalId);

    console.log('✓ Entries WITH goal mapping:', mappedEntries.length);
    console.log('✗ Entries WITHOUT goal mapping:', unmappedEntries.length);

    if (mappedEntries.length > 0) {
      console.log('\n📝 Entries with goal mapping:');
      mappedEntries.forEach((entry, i) => {
        console.log('\n' + (i + 1) + '. ' + entry.title);
        console.log('   Date: ' + entry.date.toISOString().split('T')[0]);
        console.log('   Goal ID: ' + entry.relatedGoalId);
        console.log('   Goal Type: ' + (entry.relatedGoalType || 'N/A'));
        console.log('   AI Generated: ' + (entry.isAIGenerated ? 'Yes' : 'No'));
      });
    }

    if (unmappedEntries.length > 0) {
      console.log('\n\n❌ Entries WITHOUT goal mapping (first 5):');
      unmappedEntries.slice(0, 5).forEach((entry, i) => {
        console.log('\n' + (i + 1) + '. ' + entry.title);
        console.log('   Date: ' + entry.date.toISOString().split('T')[0]);
        console.log('   AI Generated: ' + (entry.isAIGenerated ? 'Yes' : 'No'));
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkGoalMapping();
