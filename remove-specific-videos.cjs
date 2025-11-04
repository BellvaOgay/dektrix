require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB databases to check
const databases = [
  { name: 'dektrix', uri: 'mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektrix' },
  { name: 'dektirk', uri: 'mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektirk' },
  { name: 'dekabellworld', uri: 'mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dekabellworld' }
];

// Videos to remove (case-insensitive search)
const videosToRemove = ['test video upload', 'defi fundamental'];

// Video schema
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

async function findAndRemoveVideos() {
  console.log('🔍 Searching for videos to remove...');
  console.log(`Target videos: ${videosToRemove.join(', ')}`);
  console.log('');

  for (const dbInfo of databases) {
    console.log(`📂 Checking database: ${dbInfo.name}`);
    
    try {
      // Connect to the specific database
      const connection = await mongoose.createConnection(dbInfo.uri);
      const Video = connection.model('Video', videoSchema);
      
      // Create search patterns for case-insensitive matching
      const searchPatterns = videosToRemove.map(term => ({
        title: { $regex: term, $options: 'i' }
      }));
      
      // Find matching videos
      const matchingVideos = await Video.find({
        $or: searchPatterns
      });
      
      if (matchingVideos.length === 0) {
        console.log(`   ℹ️  No matching videos found in ${dbInfo.name}`);
      } else {
        console.log(`   🎯 Found ${matchingVideos.length} matching video(s) in ${dbInfo.name}:`);
        
        for (const video of matchingVideos) {
          console.log(`      - ID: ${video._id}, Title: "${video.title}", URL: ${video.videoUrl}`);
          
          try {
            // Remove the video
            await Video.findByIdAndDelete(video._id);
            console.log(`      ✅ Successfully removed video: "${video.title}" (ID: ${video._id})`);
          } catch (deleteErr) {
            console.log(`      ❌ Error removing video ID ${video._id}:`, deleteErr.message);
          }
        }
      }
      
      // Close the connection
      await connection.close();
      
    } catch (error) {
      console.log(`❌ Error accessing ${dbInfo.name}:`, error.message);
    }
  }
  
  console.log('');
  console.log('🔄 Video removal process completed.');
}

findAndRemoveVideos();