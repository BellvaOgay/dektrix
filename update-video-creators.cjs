const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dektrix');

// Define schemas
const videoSchema = new mongoose.Schema({}, { strict: false });
const Video = mongoose.model('Video', videoSchema);

async function updateVideosWithCreator() {
  try {
    const creatorId = '68f77daad55bf02b8815e5f0'; // The creator we found
    
    // First, let's see what videos exist
    const allVideos = await Video.find({}).limit(5);
    console.log('All videos:', allVideos.map(v => ({ id: v._id, title: v.title, creator: v.creator })));
    
    // Update all videos to have this creator
    const result = await Video.updateMany(
      {},
      { $set: { creator: new mongoose.Types.ObjectId(creatorId) } }
    );
    
    console.log(`Updated ${result.modifiedCount} videos with creator ID`);
    
    // Verify the update
    const updatedVideos = await Video.find({ creator: creatorId }).limit(3);
    console.log('Updated videos:', updatedVideos.map(v => ({ id: v._id, title: v.title, creator: v.creator })));
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating videos:', error);
    process.exit(1);
  }
}

updateVideosWithCreator();
