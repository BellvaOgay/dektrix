const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

const videoSchema = new mongoose.Schema({
  title: String,
  description: String,
  videoUrl: String,
  thumbnail: String,
  duration: Number,
  category: String,
  price: Number,
  priceDisplay: String,
  isFree: Boolean,
  isUnlocked: Boolean,
  totalViews: Number,
  totalUnlocks: Number,
  createdAt: Date,
  updatedAt: Date
});

const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);

async function updateVideoUrls() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update Esp5 video URL
    const esp5Result = await Video.updateOne(
      { title: { $regex: /Esp5/i } },
      { $set: { videoUrl: '/videos/Ep5.mp4', title: 'Ep5 - Premium Content' } }
    );
    console.log(`✅ Updated Esp5 video: ${esp5Result.modifiedCount} document(s) modified`);

    // Update Esp6 video URL
    const esp6Result = await Video.updateOne(
      { title: { $regex: /Esp6/i } },
      { $set: { videoUrl: '/videos/Ep6.mp4', title: 'Ep6 - Premium Content' } }
    );
    console.log(`✅ Updated Esp6 video: ${esp6Result.modifiedCount} document(s) modified`);

    console.log('🎉 Video URLs updated successfully!');
  } catch (error) {
    console.error('❌ Error updating videos:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updateVideoUrls();