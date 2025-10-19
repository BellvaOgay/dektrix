const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektirk';

// Video Schema
const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String, required: true },
  videoUrl: { type: String, required: true },
  duration: { type: Number, required: true },
  category: { type: String, required: true },
  tags: [String],
  price: { type: Number, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 },
  unlocks: { type: Number, default: 0 },
  tips: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  isFree: { type: Boolean, default: false }
}, { timestamps: true });

const Video = mongoose.model('Video', VideoSchema);

async function checkCurrentPricing() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all videos with their current pricing
    const videos = await Video.find({}, 'title videoUrl price isFree category difficulty').sort({ createdAt: -1 });
    
    console.log('📊 Current Video Pricing:');
    console.log('=' .repeat(80));
    
    videos.forEach((video, index) => {
      const priceDisplay = video.isFree ? 'FREE' : `${video.price} USDC`;
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   🔗 URL: ${video.videoUrl}`);
      console.log(`   💰 Price: ${priceDisplay}`);
      console.log(`   📁 Category: ${video.category}`);
      console.log(`   🎯 Difficulty: ${video.difficulty}`);
      console.log('');
    });

    // Summary statistics
    const totalVideos = videos.length;
    const freeVideos = videos.filter(v => v.isFree).length;
    const paidVideos = videos.filter(v => !v.isFree).length;
    const uniquePrices = [...new Set(videos.filter(v => !v.isFree).map(v => v.price))];

    console.log('📈 Pricing Summary:');
    console.log(`   Total Videos: ${totalVideos}`);
    console.log(`   Free Videos: ${freeVideos}`);
    console.log(`   Paid Videos: ${paidVideos}`);
    console.log(`   Current Prices: ${uniquePrices.join(', ')} USDC`);

    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error checking pricing:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkCurrentPricing();