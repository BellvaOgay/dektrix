require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektirk';

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

async function cleanDektirkDatabase() {
  try {
    console.log('🔗 Connecting to dektirk database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to dektirk database');

    // Get all videos
    const videos = await Video.find({});
    console.log(`📊 Found ${videos.length} videos in dektirk database`);
    
    // List all videos
    videos.forEach((video, index) => {
      console.log(`${index + 1}. "${video.title}" - ${video.videoUrl} (ID: ${video._id})`);
    });

    // Define the correct videos we want to keep
    const correctVideos = [
      { title: 'Introduction to AI Agents', videoUrl: '/videos/Vid1.mp4' },
      { title: 'DeFi Fundamentals', videoUrl: '/videos/Vid2.mp4' },
      { title: 'Blockchain Basics', videoUrl: '/videos/Vid3.mp4' },
      { title: 'Web3 Security Fundamentals', videoUrl: '/videos/Vid4.mp4' }
    ];

    console.log('\n🧹 Cleaning up database...');
    
    // Remove all videos first
    const deleteResult = await Video.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} videos`);

    // Add back only the correct videos
    for (const correctVideo of correctVideos) {
      const existingVideo = videos.find(v => 
        v.title === correctVideo.title && v.videoUrl === correctVideo.videoUrl
      );
      
      if (existingVideo) {
        // Create new video with correct data
        const newVideo = new Video({
          title: existingVideo.title,
          description: existingVideo.description || 'Video description',
          thumbnail: existingVideo.thumbnail || '/placeholder.svg',
          videoUrl: existingVideo.videoUrl,
          duration: existingVideo.duration || 180,
          category: existingVideo.category || 'General',
          tags: existingVideo.tags || [],
          price: existingVideo.price || 0,
          priceDisplay: existingVideo.priceDisplay || 'Free',
          difficulty: existingVideo.difficulty || 'Beginner',
          creator: existingVideo.creator,
          isFree: existingVideo.isFree !== undefined ? existingVideo.isFree : true,
          isActive: true
        });
        
        await newVideo.save();
        console.log(`✅ Added: ${newVideo.title}`);
      } else {
        console.log(`⚠️  Could not find existing video for: ${correctVideo.title}`);
      }
    }

    // Verify the cleanup
    const finalVideos = await Video.find({});
    console.log(`\n📊 Final count: ${finalVideos.length} videos`);
    
    finalVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} - ${video.videoUrl}`);
    });

    console.log('\n✅ Database cleanup completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

cleanDektirkDatabase();