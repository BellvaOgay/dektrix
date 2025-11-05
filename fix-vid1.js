import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/dektrix');

const Video = (await import('./src/models/Video.js')).default;

async function fixVid1References() {
  try {
    // Find all videos that reference Vid1.mp4
    const vid1Videos = await Video.find({ videoUrl: '/videos/Vid1.mp4' });
    
    console.log(`Found ${vid1Videos.length} videos with Vid1.mp4 reference`);
    
    if (vid1Videos.length > 0) {
      // Update them to use Ep1.mp4 instead
      await Video.updateMany(
        { videoUrl: '/videos/Vid1.mp4' },
        { $set: { videoUrl: '/videos/Ep1.mp4' } }
      );
      
      console.log('Successfully updated Vid1.mp4 references to use Ep1.mp4');
    }
    
    // Also check for any other missing video references
    const allVideos = await Video.find({});
    const availableVideos = ['Ep1.mp4', 'Eps2.mp4', 'TestVideo.mp4', 'Vid3.mp4', 'Vid4.mp4'];
    
    for (const video of allVideos) {
      if (video.videoUrl && video.videoUrl.startsWith('/videos/')) {
        const filename = video.videoUrl.replace('/videos/', '');
        if (!availableVideos.includes(filename)) {
          console.log(`Found missing video reference: ${video.videoUrl} in "${video.title}"`);
          // Update to use Ep1.mp4 as fallback
          await Video.findByIdAndUpdate(video._id, { videoUrl: '/videos/Ep1.mp4' });
          console.log(`Updated to use Ep1.mp4`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error fixing video references:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixVid1References();