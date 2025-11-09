import mongoose from 'mongoose';
import User from './src/models/User.js';

// Test user ID - replace with an actual user ID from your database
const TEST_USER_ID = '67a1b2c3d4e5f6a1b2c3d4e5';

async function testCreditUpdate() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('MongoDB URI not found in environment variables');
      return;
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the test user
    const user = await User.findById(TEST_USER_ID);
    if (!user) {
      console.error('Test user not found');
      return;
    }

    console.log('Current user credits:', user.viewCredits);
    
    // Simulate adding 12 credits (1 USDC payment)
    user.viewCredits = (user.viewCredits || 0) + 12;
    await user.save();
    
    console.log('Updated user credits:', user.viewCredits);
    
    // Verify the update
    const updatedUser = await User.findById(TEST_USER_ID);
    console.log('Verified credits in database:', updatedUser.viewCredits);

  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testCreditUpdate();