require('dotenv').config();
const mongoose = require('mongoose');

// Use the same MongoDB URI as in create-test-data.cjs
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

async function listAllVideos() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const videos = await Video.find({});
    console.log(`\nFound ${videos.length} videos in database:`);
    
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} - ${video.videoUrl} (Category: ${video.category})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

listAllVideos();