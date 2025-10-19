const mongoose = require('mongoose');
require('dotenv').config();

// Simple Video Schema for this script
const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String, required: true },
  videoUrl: { type: String, required: true },
  duration: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['AI Agents', 'DeFi', 'Blockchain', 'NFTs', 'Web3', 'Crypto', 'Smart Contracts', 'DAOs']
  },
  difficulty: { 
    type: String, 
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  price: { type: Number, required: true },
  priceDisplay: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isFree: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', VideoSchema);

// Simple User Schema for creator
const UserSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Local videos data
const localVideos = [
  {
    title: "Educational Video 1",
    description: "First educational video from local storage. This video covers fundamental concepts and is available to all users for free learning.",
    thumbnail: "/placeholder.svg", // Using existing placeholder
    videoUrl: "/Vid1.mp4", // Local video file
    duration: 300, // 5 minutes (you can adjust this)
    category: "Blockchain",
    difficulty: "Beginner",
    price: 0,
    priceDisplay: "FREE",
    isFree: true
  },
  {
    title: "Educational Video 2", 
    description: "Second educational video from local storage. This video provides additional insights and practical examples for learners.",
    thumbnail: "/placeholder.svg", // Using existing placeholder
    videoUrl: "/vid2.mp4", // Local video file
    duration: 420, // 7 minutes (you can adjust this)
    category: "Web3",
    difficulty: "Beginner", 
    price: 0,
    priceDisplay: "FREE",
    isFree: true
  },
  {
    title: "Educational Video 3",
    description: "New local video added from private_videos folder.",
    thumbnail: "/placeholder.svg",
    videoUrl: "/Vid3.mp4",
    duration: 360, // 6 minutes
    category: "AI Agents",
    difficulty: "Beginner",
    price: 0,
    priceDisplay: "FREE",
    isFree: true
  }
];

async function addLocalVideos() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create or find admin user
    let adminUser = await User.findOne({ address: 'admin-local-videos' });
    if (!adminUser) {
      adminUser = new User({
        address: 'admin-local-videos',
        username: 'Local Video Admin'
      });
      await adminUser.save();
      console.log('✅ Created admin user for local videos');
    }

    // Add videos to database
    console.log('📹 Adding local videos to database...');
    
    for (const videoData of localVideos) {
      // Check if video already exists
      const existingVideo = await Video.findOne({ 
        title: videoData.title,
        videoUrl: videoData.videoUrl 
      });
      
      if (existingVideo) {
        console.log(`⚠️  Video "${videoData.title}" already exists, ensuring isActive=true...`);
        await Video.updateOne({ _id: existingVideo._id }, { $set: { isActive: true } });
        continue;
      }

      const video = new Video({
        ...videoData,
        isActive: true,
        creator: adminUser._id
      });
      
      await video.save();
      console.log(`✅ Added: ${videoData.title} (${videoData.priceDisplay})`);
    }

    console.log('🎉 Successfully added all local videos!');
    console.log('📝 Videos are now available in your app\'s Videos tab');
    
  } catch (error) {
    console.error('❌ Error adding local videos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

// Run the script
addLocalVideos();