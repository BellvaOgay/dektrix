// Script to verify Vid3 and Vid4 uploads to database
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektirk';

// Video Schema
const VideoSchema = new mongoose.Schema({
  title: String,
  description: String,
  videoUrl: String,
  category: String,
  priceDisplay: String,
  difficulty: String,
  tags: [String],
  featured: Boolean,
  isFree: Boolean
}, { timestamps: true });

const Video = mongoose.model('Video', VideoSchema);

async function verifyUploads() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find Vid3 and Vid4 entries
    const vid3Videos = await Video.find({
      $or: [
        { videoUrl: '/Vid3.mp4' },
        { videoUrl: '/videos/Vid3.mp4' },
        { title: 'Advanced Blockchain Architecture' }
      ]
    });

    const vid4Videos = await Video.find({
      $or: [
        { videoUrl: '/Vid4.mp4' },
        { videoUrl: '/videos/Vid4.mp4' },
        { title: 'NFT Marketplace Development' }
      ]
    });

    console.log('\n📹 Vid3 Database Entries:');
    if (vid3Videos.length === 0) {
      console.log('❌ No Vid3 entries found');
    } else {
      vid3Videos.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   🔗 URL: ${video.videoUrl}`);
        console.log(`   📁 Category: ${video.category}`);
        console.log(`   💰 Price: ${video.priceDisplay}`);
        console.log(`   🎯 Difficulty: ${video.difficulty}`);
        console.log(`   ⭐ Featured: ${video.featured}`);
        console.log('');
      });
    }

    console.log('📹 Vid4 Database Entries:');
    if (vid4Videos.length === 0) {
      console.log('❌ No Vid4 entries found');
    } else {
      vid4Videos.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   🔗 URL: ${video.videoUrl}`);
        console.log(`   📁 Category: ${video.category}`);
        console.log(`   💰 Price: ${video.priceDisplay}`);
        console.log(`   🎯 Difficulty: ${video.difficulty}`);
        console.log(`   ⭐ Featured: ${video.featured}`);
        console.log('');
      });
    }

    // Summary
    console.log('📊 Upload Summary:');
    console.log(`   Vid3 entries: ${vid3Videos.length}`);
    console.log(`   Vid4 entries: ${vid4Videos.length}`);
    console.log(`   Total new entries: ${vid3Videos.length + vid4Videos.length}`);

    if (vid3Videos.length > 0 && vid4Videos.length > 0) {
      console.log('✅ Both Vid3 and Vid4 successfully uploaded to database!');
    } else {
      console.log('⚠️  Some videos may not have been uploaded correctly');
    }

  } catch (error) {
    console.error('❌ Error verifying uploads:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

verifyUploads();