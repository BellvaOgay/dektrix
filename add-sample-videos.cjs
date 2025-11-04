// Simple script to add sample videos to MongoDB
// Run with: node add-sample-videos.js

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektirk';

// Video Schema (simplified)
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
  tags: [String],
  price: { type: Number, required: true },
  priceDisplay: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalViews: { type: Number, default: 0 },
  totalUnlocks: { type: Number, default: 0 },
  totalTipsEarned: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  isFree: { type: Boolean, default: false }
}, { timestamps: true });

const Video = mongoose.model('Video', VideoSchema);

// Sample videos to add
const sampleVideos = [
  {
    title: "Free: What is Blockchain?",
    description: "A free introduction to blockchain technology for beginners",
    thumbnail: "/placeholder.svg",
    videoUrl: "/videos/Vid3.mp4",
    duration: 120,
    category: "Blockchain",
    tags: ["blockchain", "basics", "free"],
    price: 0,
    priceDisplay: "Free",
    difficulty: "Beginner",
    featured: true,
    isFree: true // This is a free video
  }
];

async function addSampleVideos() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create a sample user first (needed for creator field)
    const UserSchema = new mongoose.Schema({
      username: String,
      displayName: String,
      walletAddress: String,
      fid: Number
    });

    const User = mongoose.model('User', UserSchema);

    let sampleUser = await User.findOne({ username: 'admin' });
    if (!sampleUser) {
      sampleUser = new User({
        username: 'admin',
        displayName: 'Admin User',
        walletAddress: '0x1234567890123456789012345678901234567890',
        fid: 12345
      });
      await sampleUser.save();
      console.log('✅ Created sample user');
    }

    // Add creator ID to videos
    const videosWithCreator = sampleVideos.map(video => ({
      ...video,
      creator: sampleUser._id
    }));

    // Insert videos
    const result = await Video.insertMany(videosWithCreator);
    console.log(`✅ Added ${result.length} videos to the database`);

    // Display added videos
    result.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} (${video.isFree ? 'FREE' : video.priceDisplay})`);
    });

  } catch (error) {
    console.error('❌ Error adding videos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

// Run the script
addSampleVideos();