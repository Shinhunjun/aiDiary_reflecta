const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const resetPassword = async () => {
  try {
    const uri = "mongodb+srv://jun:970213@cluster0.ce0oj.mongodb.net/reflecta?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas');

    const email = 'test@example.com';
    const newPassword = 'test123';

    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('📝 Found user:', email);
    console.log('🔄 Updating password...');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password updated successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', newPassword);

    // Test the password
    const isMatch = await bcrypt.compare(newPassword, user.password);
    console.log('\n🔍 Password verification:', isMatch ? '✅ SUCCESS' : '❌ FAILED');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetPassword();
