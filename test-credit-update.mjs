import mongoose from 'mongoose';

// Import the compiled User model using dynamic import
const UserModule = await import('./api-compiled/src/models/User.js');
const User = UserModule.default;

async function testCreditUpdate() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
  if (!MONGODB_URI) {
    console.log('MongoDB URI not found in environment variables');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the first user
    const users = await User.find().limit(5);
    console.log('Found users:');
    users.forEach(user => {
      console.log(`- ID: ${user._id}, Username: ${user.username}, Credits: ${user.viewCredits}`);
    });

    if (users.length === 0) {
      console.log('No users found in database');
      return;
    }

    // Test with the first user
    const testUser = users[0];
    console.log('\nTesting credit update for user:', testUser.username);
    console.log('Current credits:', testUser.viewCredits);
    
    // Simulate adding 12 credits (1 USDC payment)
    testUser.viewCredits = (testUser.viewCredits || 0) + 12;
    await testUser.save();
    
    console.log('Updated credits:', testUser.viewCredits);
    
    // Verify the update by fetching the user again
    const updatedUser = await User.findById(testUser._id);
    console.log('Verified credits in database:', updatedUser.viewCredits);

    if (updatedUser.viewCredits === testUser.viewCredits) {
      console.log('✅ Credit update successful!');
    } else {
      console.log('❌ Credit update failed!');
    }

  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testCreditUpdate();