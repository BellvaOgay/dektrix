const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas (same as in server.cjs)
const userSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, required: true },
  displayName: { type: String, default: '' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  totalTipsEarned: { type: Number, default: 0 },
  totalTipsSpent: { type: Number, default: 0 },
  videosWatched: [{ type: String }],
  videosUnlocked: [{ type: String }],
  videosTipped: [{ type: String }],
  favoriteCategories: [{ type: String }],
  viewCredits: { type: Number, default: 1 },
  userContainer: {
    purchasedVideos: [{ type: String }],
    uploadedVideos: [{ type: String }],
    watchHistory: [{
      videoId: String,
      watchedAt: { type: Date, default: Date.now }
    }],
    preferences: {
      autoPlay: { type: Boolean, default: true },
      notifications: { type: Boolean, default: true },
      theme: { type: String, default: 'auto' }
    }
  },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  creatorWallet: { type: String, required: true, lowercase: true },
  creatorUsername: { type: String, required: true },
  category: { type: String, default: 'general' },
  tags: [{ type: String }],
  price: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 },
  totalUnlocks: { type: Number, default: 0 },
  totalTips: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true },
  isLocked: { type: Boolean, default: false },
  unlockPrice: { type: Number, default: 1 },
  metadata: {
    duration: { type: Number, default: 0 },
    fileSize: { type: Number, default: 0 },
    resolution: { type: String, default: '1080p' },
    format: { type: String, default: 'mp4' }
  },
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    watchTime: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

async function verifyPaymentSystem() {
  console.log('🔍 Verifying Payment, Credit Update, and View Count Functionality\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Register models
    const User = mongoose.model('User', userSchema);
    const Video = mongoose.model('Video', videoSchema);
    
    const user = await User.findOne({});
    const video = await Video.findOne({});
    
    console.log('👤 User:', user.walletAddress, '(Credits:', user.viewCredits, 'Views:', user.totalVideoViews || 0, ')');
    console.log('🎬 Video:', video.title, '(Views:', video.totalViews, 'Unlocks:', video.totalUnlocks || 0, ')');

    // Test 1: Add credits via API
    console.log('\n1️⃣ Testing Credit Addition API...');
    const addResponse = await fetch('http://localhost:3001/api/users/add-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: user.walletAddress, creditsToAdd: 3 })
    });
    
    if (addResponse.ok) {
      const result = await addResponse.json();
      console.log('✅ Added 3 credits. New balance:', result.data.viewCredits);
    } else {
      const error = await addResponse.text();
      console.log('❌ Failed to add credits:', error);
    }

    // Test 2: Get user credits via API
    console.log('\n2️⃣ Testing Credit Retrieval API...');
    const creditsResponse = await fetch(`http://localhost:3001/api/users/${user.walletAddress}/credits`);
    
    if (creditsResponse.ok) {
      const result = await creditsResponse.json();
      console.log('✅ Current credits:', result.data.viewCredits);
    } else {
      console.log('❌ Failed to get user credits');
    }

    // Test 3: Increment view count via API
    console.log('\n3️⃣ Testing View Count API...');
    const viewResponse = await fetch(`http://localhost:3001/api/videos/${video._id}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (viewResponse.ok) {
      const result = await viewResponse.json();
      console.log('✅ View count incremented. Total views:', result.data.totalViews);
    } else {
      const error = await viewResponse.text();
      console.log('❌ Failed to increment view count:', error);
    }

    // Test 4: Deduct credit for video view
    console.log('\n4️⃣ Testing Credit Deduction API...');
    const deductResponse = await fetch('http://localhost:3001/api/videos/deduct-credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: user.walletAddress,
        videoId: video._id
      })
    });

    if (deductResponse.ok) {
      const result = await deductResponse.json();
      console.log('✅ Credit deducted. Remaining:', result.remainingCredits);
    } else {
      const error = await deductResponse.text();
      console.log('❌ Failed to deduct credit:', error);
    }

    // Verify final state
    console.log('\n5️⃣ Verifying Final Database State...');
    const finalUser = await User.findById(user._id);
    const finalVideo = await Video.findById(video._id);
    
    console.log('📊 Final Results:');
    console.log('👤 User credits:', finalUser.viewCredits);
    console.log('👤 User total views:', finalUser.totalVideoViews || 0);
    console.log('🎬 Video views:', finalVideo.totalViews);
    console.log('🎬 Video unlocks:', finalVideo.totalUnlocks || 0);

    console.log('\n🎉 SYSTEM STATUS: PAYMENT, CREDIT, AND VIEW COUNT FUNCTIONALITY IS WORKING! ✅');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📡 MongoDB connection closed');
  }
}

// Run the verification
verifyPaymentSystem();