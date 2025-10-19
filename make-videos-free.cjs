require('dotenv').config();
const mongoose = require('mongoose');

// Video Schema
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
  thumbnail: { type: String },
  category: { 
    type: String, 
    enum: ['ai-agents', 'defi', 'blockchain', 'nfts', 'web3', 'crypto', 'smart-contracts', 'daos', 'generic'],
    required: true 
  },
  tags: [{ type: String }],
  duration: { type: Number, required: true },
  price: { type: Number, required: true, default: 0 },
  priceDisplay: { type: String, required: true, default: 'Free' },
  difficulty: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true 
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  featured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  purchases: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', videoSchema);

async function makeAllVideosFree() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all videos before update
    const allVideos = await Video.find({});
    console.log(`📹 Found ${allVideos.length} videos in the database`);

    if (allVideos.length === 0) {
      console.log('⚠️ No videos found in the database');
      return;
    }

    // Show current pricing
    const paidVideos = allVideos.filter(video => video.price > 0);
    console.log(`💰 Currently ${paidVideos.length} videos have a price > 0`);

    if (paidVideos.length > 0) {
      console.log('\n📊 Current paid videos:');
      paidVideos.forEach(video => {
        console.log(`  - "${video.title}" - Price: ${video.price} (${video.priceDisplay})`);
      });
    }

    // Update all videos to be free
    console.log('\n🆓 Making all videos free...');
    const updateResult = await Video.updateMany(
      {}, // Update all videos
      {
        $set: {
          price: 0,
          priceDisplay: 'Free',
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} videos`);

    // Verify the changes
    const updatedVideos = await Video.find({ price: { $gt: 0 } });
    if (updatedVideos.length === 0) {
      console.log('🎉 Success! All videos are now free to view');
    } else {
      console.log(`⚠️ Warning: ${updatedVideos.length} videos still have a price > 0`);
    }

    // Show final statistics
    const totalFreeVideos = await Video.countDocuments({ price: 0 });
    console.log(`\n📈 Final statistics:`);
    console.log(`  - Total videos: ${allVideos.length}`);
    console.log(`  - Free videos: ${totalFreeVideos}`);
    console.log(`  - Paid videos: ${allVideos.length - totalFreeVideos}`);

  } catch (error) {
    console.error('❌ Error making videos free:', error);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
makeAllVideosFree();