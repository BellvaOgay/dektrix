// Simple script to update video URLs via API
async function updateVideoUrl() {
  try {
    // First, let's get all videos to find the one with Vid1.mp4
    const response = await fetch('http://localhost:3001/api/videos?limit=50');
    const data = await response.json();
    
    if (data.success) {
      const vid1Videos = data.data.filter(video => video.videoUrl === '/videos/Vid1.mp4');
      
      console.log(`Found ${vid1Videos.length} videos with Vid1.mp4 reference`);
      
      // For now, let's just log them so we know what needs to be fixed
      vid1Videos.forEach(video => {
        console.log(`Video ID: ${video._id}, Title: "${video.title}", Current URL: ${video.videoUrl}`);
      });
      
      console.log('\nTo fix this, you can either:');
      console.log('1. Rename Ep1.mp4 to Vid1.mp4 in your public/videos folder');
      console.log('2. Or update the database entry to use an existing video file');
      console.log('3. Or add a Vid1.mp4 file to your public/videos folder');
    }
  } catch (error) {
    console.error('Error checking videos:', error);
  }
}

updateVideoUrl();