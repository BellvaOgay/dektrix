const mongoose = require('mongoose');
require('dotenv').config();

async function checkExistingVideos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Video = mongoose.models.Video || mongoose.model('Video', require('./src/models/Video.ts').VideoSchema);
    
    const videos = await Video.find().limit(3);
    console.log('\n📹 Sample Videos:');
    videos.forEach((video, index) => {
      console.log(`\nVideo ${index + 1}:`);
      console.log('Title:', video.title);
      console.log('Creator:', video.creator);
      console.log('Creator Type:', typeof video.creator);
      console.log('Is Free:', video.isFree);
      console.log('Price:', video.price);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error checking videos:', error);
  }
}

checkExistingVideos();