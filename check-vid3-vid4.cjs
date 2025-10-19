require('dotenv').config();
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: String,
  description: String,
  videoUrl: String,
  thumbnail: String,
  duration: Number,
  category: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', videoSchema);

async function checkVideos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully\n');

    console.log('=== Checking Vid3 and Vid4 with IDs ===\n');

    // Find Vid3 (Blockchain Basics)
    const vid3 = await Video.findOne({ title: 'Blockchain Basics' });
    if (vid3) {
      console.log('Vid3 found:');
      console.log('- ID:', vid3._id.toString());
      console.log('- Title:', vid3.title);
      console.log('- Video URL:', vid3.videoUrl);
      console.log('- Duration:', vid3.duration);
      console.log();
    } else {
      console.log('Vid3 not found in database\n');
    }

    // Find Vid4 (Web3 Security Fundamentals)
    const vid4 = await Video.findOne({ title: 'Web3 Security Fundamentals' });
    if (vid4) {
      console.log('Vid4 found:');
      console.log('- ID:', vid4._id.toString());
      console.log('- Title:', vid4.title);
      console.log('- Video URL:', vid4.videoUrl);
      console.log('- Duration:', vid4.duration);
      console.log();
    } else {
      console.log('Vid4 not found in database\n');
    }

    console.log('=== All Videos with IDs ===');
    const allVideos = await Video.find({});
    allVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} - ID: ${video._id.toString()} - URL: ${video.videoUrl}`);
    });

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkVideos();