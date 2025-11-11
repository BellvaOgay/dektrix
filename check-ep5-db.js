const mongoose = require('mongoose');

async function checkEp5() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
  console.log('MONGODB_URI:', MONGODB_URI ? 'Set' : 'Not set');

  if (!MONGODB_URI) {
    console.log('Please set MONGODB_URI environment variable');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const Video = mongoose.model('Video', new mongoose.Schema({}));
    
    // Check if Ep5 exists
    const ep5Video = await Video.findOne({
      $or: [
        { title: { $regex: new RegExp('Ep5', 'i') } },
        { filename: { $regex: new RegExp('Ep5\\.mp4$', 'i') } },
        { videoUrl: { $regex: new RegExp('Ep5\\.mp4$', 'i') } }
      ]
    });
    
    if (ep5Video) {
      console.log('Ep5 found in database:');
      console.log(JSON.stringify({
        _id: ep5Video._id,
        title: ep5Video.title,
        filename: ep5Video.filename,
        videoUrl: ep5Video.videoUrl,
        isActive: ep5Video.isActive
      }, null, 2));
    } else {
      console.log('Ep5 not found in database');
      
      // List all videos to see what's available
      const allVideos = await Video.find({}).select('title filename videoUrl isActive').limit(10);
      console.log('Available videos:');
      allVideos.forEach(v => {
        console.log(`- ${v.title} (${v.filename || v.videoUrl})${v.isActive === false ? ' [INACTIVE]' : ''}`);
      });
    }
    
    await mongoose.connection.close();
    console.log('Connection closed');
    
  } catch (err) {
    console.log('MongoDB connection failed:', err.message);
  }
}

checkEp5();