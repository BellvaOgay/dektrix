const mongoose = require('mongoose');

// MongoDB connection
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

async function updatePricing() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Convert 0.1 USDC to wei format (0.1 * 1,000,000 = 100,000)
    const newPrice = 100000; // 0.1 USDC in wei format
    
    console.log('📊 Current Pricing Status:');
    const beforeUpdate = await Video.find({}, 'title price isFree').sort({ createdAt: -1 });
    beforeUpdate.forEach((video, index) => {
      const priceDisplay = video.isFree ? 'FREE' : `${video.price / 1000000} USDC`;
      console.log(`${index + 1}. ${video.title} - ${priceDisplay}`);
    });

    console.log('\n🔄 Updating all paid video prices to 0.1 USDC...');
    
    // Update all videos that are not free to the new price
    const updateResult = await Video.updateMany(
      { isFree: false }, // Only update paid videos
      { $set: { price: newPrice } }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} videos\n`);

    console.log('📊 Updated Pricing Status:');
    const afterUpdate = await Video.find({}, 'title price isFree').sort({ createdAt: -1 });
    afterUpdate.forEach((video, index) => {
      const priceDisplay = video.isFree ? 'FREE' : `${video.price / 1000000} USDC`;
      console.log(`${index + 1}. ${video.title} - ${priceDisplay}`);
    });

    // Summary
    const totalVideos = afterUpdate.length;
    const freeVideos = afterUpdate.filter(v => v.isFree).length;
    const paidVideos = afterUpdate.filter(v => !v.isFree).length;

    console.log('\n📈 Final Pricing Summary:');
    console.log(`   Total Videos: ${totalVideos}`);
    console.log(`   Free Videos: ${freeVideos}`);
    console.log(`   Paid Videos: ${paidVideos} (all now 0.1 USDC)`);

    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
    console.log('🎉 Pricing update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating pricing:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

updatePricing();