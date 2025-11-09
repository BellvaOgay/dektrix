const mongoose = require('mongoose');
require('dotenv').config();

async function addEp6ToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Video = mongoose.models.Video || mongoose.model('Video', require('./src/models/Video.ts').VideoSchema);
    
    // Create a valid ObjectId for creator (using a placeholder)
    const creatorId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    
    // Check if Ep6 already exists
    const existingEp6 = await Video.findOne({
      $or: [
        { title: { $regex: /Ep6/i } },
        { filename: { $regex: /Ep6\.mp4$/i } }
      ]
    });
    
    if (existingEp6) {
      console.log('⚠️ Ep6 already exists in database. Updating to locked configuration...');
      
      // Update existing Ep6 to be locked
      existingEp6.isFree = false;
      existingEp6.price = 100000; // 0.1 USDC
      existingEp6.priceDisplay = '0.1 USDC';
      existingEp6.category = 'Blockchain';
      existingEp6.isActive = true;
      existingEp6.creator = creatorId; // Add creator field
      existingEp6.duration = 180; // 3 minutes
      
      await existingEp6.save();
      console.log('✅ Updated existing Ep6 to locked configuration');
      console.log('Title:', existingEp6.title);
      console.log('Price:', existingEp6.price);
      console.log('Is Free:', existingEp6.isFree);
      console.log('Should be locked:', existingEp6.price > 0 && !existingEp6.isFree ? '🔒 YES' : '🔓 NO');
    } else {
      console.log('➕ Adding new Ep6 video to database with locked configuration...');
      
      // Create new Ep6 video with locked configuration
      const ep6Video = new Video({
        title: 'Ep6 - The Next Chapter',
        description: 'Ep6 - The Next Chapter - Premium content',
        filename: 'Ep6.mp4',
        videoUrl: '/videos/Ep6.mp4',
        thumbnail: '/placeholder.svg',
        duration: 180, // 3 minutes (within the 300s limit)
        category: 'Blockchain',
        tags: ['ep6', 'premium', 'blockchain'],
        price: 100000, // 0.1 USDC
        priceDisplay: '0.1 USDC',
        tipAmount: 100000,
        tipAmountDisplay: '0.1 USDC',
        difficulty: 'Beginner',
        creator: creatorId, // Required field
        totalViews: 0,
        totalUnlocks: 0,
        totalTipsEarned: 0,
        playCount: 0,
        isActive: true,
        isFree: false
      });
      
      await ep6Video.save();
      console.log('✅ Added new Ep6 video to database');
      console.log('Title:', ep6Video.title);
      console.log('Price:', ep6Video.price);
      console.log('Is Free:', ep6Video.isFree);
      console.log('Should be locked:', ep6Video.price > 0 && !ep6Video.isFree ? '🔒 YES' : '🔓 NO');
    }
    
    await mongoose.disconnect();
    console.log('✅ Database operation completed successfully');
    
  } catch (error) {
    console.error('❌ Error adding/updating Ep6:', error);
  }
}

addEp6ToDatabase();