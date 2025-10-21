const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dektrix');

// Define schemas
const videoSchema = new mongoose.Schema({}, { strict: false });
const Video = mongoose.model('Video', videoSchema);

async function updateVideoPricing() {
  try {
    console.log('🎬 Updating all videos to require 0.1 USDC payment...');
    
    // Update all videos to require 0.1 USDC payment
    const result = await Video.updateMany(
      {},
      { 
        $set: { 
          price: 100000, // 0.1 USDC in wei (6 decimals)
          priceDisplay: "0.1 USDC",
          isFree: false // Make all videos premium
        } 
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} videos with 0.1 USDC pricing`);
    
    // Verify the update
    const updatedVideos = await Video.find({}).limit(3);
    console.log('Updated videos pricing:', updatedVideos.map(v => ({ 
      title: v.title, 
      price: v.price, 
      priceDisplay: v.priceDisplay, 
      isFree: v.isFree 
    })));
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating video pricing:', error);
    process.exit(1);
  }
}

updateVideoPricing();