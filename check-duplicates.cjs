require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektrix';

// Define Video schema
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String, required: true },
  videoUrl: { type: String, required: true },
  duration: { type: Number, required: true },
  category: { type: String, required: true },
  tags: [String],
  price: { type: Number, default: 0 },
  priceDisplay: { type: String, default: 'Free' },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isFree: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', videoSchema);

async function checkDuplicates() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all videos
    const videos = await Video.find({});
    console.log(`\n📊 Found ${videos.length} total videos in database:`);
    
    // Check for duplicates by title
    const titleCounts = {};
    const urlCounts = {};
    
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} - ${video.videoUrl} (ID: ${video._id})`);
      
      // Count by title
      titleCounts[video.title] = (titleCounts[video.title] || 0) + 1;
      
      // Count by videoUrl
      urlCounts[video.videoUrl] = (urlCounts[video.videoUrl] || 0) + 1;
    });

    console.log('\n🔍 Checking for duplicates by title:');
    Object.entries(titleCounts).forEach(([title, count]) => {
      if (count > 1) {
        console.log(`❌ DUPLICATE TITLE: "${title}" appears ${count} times`);
      } else {
        console.log(`✅ "${title}" - unique`);
      }
    });

    console.log('\n🔍 Checking for duplicates by video URL:');
    Object.entries(urlCounts).forEach(([url, count]) => {
      if (count > 1) {
        console.log(`❌ DUPLICATE URL: "${url}" appears ${count} times`);
      } else {
        console.log(`✅ "${url}" - unique`);
      }
    });

    // Specifically check for Vid2 and Vid4
    console.log('\n🎯 Specific checks:');
    const vid2Videos = videos.filter(v => v.videoUrl.includes('Vid2.mp4'));
    const vid4Videos = videos.filter(v => v.videoUrl.includes('Vid4.mp4'));
    
    console.log(`📹 Vid2.mp4 entries: ${vid2Videos.length}`);
    vid2Videos.forEach((video, index) => {
      console.log(`   ${index + 1}. "${video.title}" (ID: ${video._id})`);
    });
    
    console.log(`📹 Vid4.mp4 entries: ${vid4Videos.length}`);
    vid4Videos.forEach((video, index) => {
      console.log(`   ${index + 1}. "${video.title}" (ID: ${video._id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

checkDuplicates();