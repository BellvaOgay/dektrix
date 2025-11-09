const mongoose = require('mongoose');
require('dotenv').config();

async function checkEp6() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Video = mongoose.models.Video || mongoose.model('Video', require('./src/models/Video.ts').VideoSchema);
    
    // Check if Ep6 exists
    const ep6 = await Video.findOne({ 
      $or: [
        { title: { $regex: /Ep6/i } },
        { filename: { $regex: /Ep6\.mp4$/i } }
      ]
    });
    
    if (ep6) {
      console.log('🔍 Ep6 Video Details:');
      console.log('Title:', ep6.title);
      console.log('Is Free:', ep6.isFree);
      console.log('Price:', ep6.price);
      console.log('Price Display:', ep6.priceDisplay);
      console.log('Video URL:', ep6.videoUrl);
      console.log('Should be locked:', ep6.price > 0 && !ep6.isFree ? '🔒 YES' : '🔓 NO');
    } else {
      console.log('❌ Ep6 video not found in database - will need to be added');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error checking Ep6:', error);
  }
}

checkEp6();