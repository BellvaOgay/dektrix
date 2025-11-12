import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dektrix');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Test transaction flow
async function testTransactionFlow() {
  try {
    await connectDB();
    
    // Import models
    const User = (await import('./src/models/User.js')).default;
const Video = (await import('./src/models/Video.js')).default;
    const Transaction = (await import('./src/models/Transaction.js')).default;
    
    console.log('🧪 Testing transaction flow...');
    
    // Find a test user and video
    const testUser = await User.findOne();
    const testVideo = await Video.findOne();
    
    if (!testUser || !testVideo) {
      console.log('❌ No test user or video found. Please ensure there is data in the database.');
      return;
    }
    
    console.log(`👤 Test User: ${testUser.username} (${testUser._id})`);
    console.log(`🎥 Test Video: ${testVideo.title} (${testVideo._id})`);
    
    // Create a test transaction
    const testTransaction = new Transaction({
      user: testUser._id,
      video: testVideo._id,
      type: 'unlock',
      amount: 100000, // 0.1 USDC in wei
      amountDisplay: '0.1 USDC',
      paymentMethod: 'crypto',
      transactionHash: '0x' + Math.random().toString(16).substring(2, 66), // Random hash
      status: 'completed',
      metadata: {
        basePayAmount: 0,
        basePayApplied: false,
        originalAmount: 100000
      }
    });
    
    await testTransaction.save();
    console.log('✅ Test transaction created successfully');
    
    // Verify transaction was saved
    const savedTransaction = await Transaction.findById(testTransaction._id);
    console.log('📊 Transaction details:', {
      id: savedTransaction._id,
      user: savedTransaction.user,
      video: savedTransaction.video,
      amount: savedTransaction.amount,
      status: savedTransaction.status,
      paymentMethod: savedTransaction.paymentMethod
    });
    
    // Test video unlock functionality
    if (!testUser.videosUnlocked.includes(testVideo._id)) {
      testUser.videosUnlocked.push(testVideo._id);
      await testUser.save();
      console.log('✅ Video added to user\'s unlocked videos');
    }
    
    // Update video stats
    testVideo.totalUnlocks += 1;
    await testVideo.save();
    console.log('✅ Video unlock count incremented');
    
    // Verify updates
    const updatedUser = await User.findById(testUser._id);
    const updatedVideo = await Video.findById(testVideo._id);
    
    console.log('📊 Final verification:');
    console.log(`   User unlocked videos: ${updatedUser.videosUnlocked.length}`);
    console.log(`   Video total unlocks: ${updatedVideo.totalUnlocks}`);
    console.log(`   Transaction exists: ${!!savedTransaction}`);
    
    console.log('🎉 Transaction flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in transaction flow test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the test
testTransactionFlow();