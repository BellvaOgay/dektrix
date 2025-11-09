const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI or VITE_MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Video Schema (simplified version for this script)
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  videoUrl: { type: String, required: true },
  thumbnail: String,
  duration: { type: Number, default: 0 },
  category: { type: String, default: 'Entertainment' },
  price: { type: Number, default: 100000 }, // 0.1 USDC in micro units
  priceDisplay: { type: String, default: '0.1 USDC' },
  isFree: { type: Boolean, default: false },
  isUnlocked: { type: Boolean, default: false },
  totalViews: { type: Number, default: 0 },
  totalUnlocks: { type: Number, default: 0 },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);

// Videos to add
const espVideos = [
  {
    title: 'Esp5 - Premium Content',
    description: 'Esp5 - Exclusive premium video content',
    videoUrl: '/videos/Esp5.mp4',
    thumbnail: '/placeholder.svg',
    duration: 0,
    category: 'Entertainment',
    price: 100000, // 0.1 USDC
    priceDisplay: '0.1 USDC',
    isFree: false,
    isUnlocked: false,
    totalViews: 0,
    totalUnlocks: 0
  },
  {
    title: 'Esp6 - Premium Content',
    description: 'Esp6 - Exclusive premium video content',
    videoUrl: '/videos/Esp6.mp4',
    thumbnail: '/placeholder.svg',
    duration: 0,
    category: 'Entertainment',
    price: 100000, // 0.1 USDC
    priceDisplay: '0.1 USDC',
    isFree: false,
    isUnlocked: false,
    totalViews: 0,
    totalUnlocks: 0
  }
];

async function addEspVideos() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    for (const videoData of espVideos) {
      // Check if video already exists
      const existingVideo = await Video.findOne({
        $or: [
          { title: { $regex: new RegExp(videoData.title.split(' ')[0], 'i') } },
          { videoUrl: videoData.videoUrl }
        ]
      });

      if (existingVideo) {
        console.log(`⚠️  ${videoData.title} already exists in database`);
        continue;
      }

      // Create new video
      const newVideo = new Video(videoData);
      await newVideo.save();
      console.log(`✅ Added ${videoData.title} to database`);
    }

    console.log('🎉 All Esp videos processed successfully!');
  } catch (error) {
    console.error('❌ Error adding Esp videos:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
addEspVideos();