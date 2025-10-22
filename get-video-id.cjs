require('dotenv').config();
const mongoose = require('mongoose');

// Video schema
const videoSchema = new mongoose.Schema({
  title: String,
  description: String,
  videoUrl: String,
  thumbnailUrl: String,
  category: String,
  creator: String,
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isFree: { type: Boolean, default: false },
  perViewAttribution: { type: Number, default: 0 }
});

const Video = mongoose.model('Video', videoSchema);

async function getVideoId() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the first video
    const video = await Video.findOne();
    
    if (video) {
      console.log(`Video ID: ${video._id}`);
      console.log(`Video Title: ${video.title}`);
      console.log(`Video URL: ${video.videoUrl}`);
    } else {
      console.log('No videos found in database');
    }

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getVideoId();