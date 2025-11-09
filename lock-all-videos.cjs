const mongoose = require('mongoose');
require('dotenv').config();

async function lockAllVideos() {
  try {
    console.log('🔒 Locking all videos to require payment...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektrix');
    
    // Update all videos to require payment
    const Video = mongoose.model('Video', new mongoose.Schema({}, { strict: false }));
    
    const result = await Video.updateMany(
      {},
      { 
        $set: { 
          isFree: false,
          price: 100000, // 0.1 USDC in wei (6 decimals)
          priceDisplay: '0.1 USDC'
        } 
      }
    );
    
    console.log(`✅ Locked ${result.modifiedCount} videos - all now require payment`);
    console.log('💰 Pricing set to: 0.1 USDC per view');
    console.log('💳 Users can pay per view or buy 10 credits for 1 USDC');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error locking videos:', error);
    process.exit(1);
  }
}

lockAllVideos();