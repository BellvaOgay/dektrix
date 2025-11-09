const mongoose = require('mongoose');
require('dotenv').config();

async function fixVideoCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get the Video model
    const Video = mongoose.models.Video || mongoose.model('Video', require('./src/models/Video.ts').VideoSchema);
    
    // Update all videos to use valid categories
    const result = await Video.updateMany(
      {},
      { 
        $set: { 
          category: 'Blockchain', // Use a valid category from the enum
          isFree: false, // Make sure they're not free
          price: 100000, // 0.1 USDC
          priceDisplay: '0.1 USDC'
        }
      }
    );
    
    console.log('✅ Updated', result.modifiedCount, 'videos with valid categories and pricing');
    
    // Verify the changes
    const videos = await Video.find({});
    console.log('\n🔍 Updated Video Details:');
    console.log('========================');
    
    videos.forEach((video, index) => {
      console.log('\nVideo ' + (index + 1) + ': ' + video.title);
      console.log('  Category: ' + video.category);
      console.log('  Is Free: ' + video.isFree);
      console.log('  Price: ' + video.price);
      console.log('  Price Display: ' + video.priceDisplay);
      console.log('  Should be locked: ' + (video.price > 0 && !video.isFree ? '🔒 YES' : '🔓 NO'));
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error fixing video categories:', error);
  }
}

fixVideoCategories();