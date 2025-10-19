const mongoose = require('mongoose');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektirk');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Video schema
const videoSchema = new mongoose.Schema({
  title: String,
  description: String,
  videoUrl: String,
  thumbnail: String,
  duration: Number,
  category: String,
  difficulty: String,
  price: { type: Number, default: 0 },
  priceDisplay: { type: String, default: 'Free' },
  tags: [String],
  featured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  creator: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', videoSchema);

const checkPricing = async () => {
  try {
    await connectDB();
    
    console.log('\n🔍 Checking current video pricing...\n');
    
    const videos = await Video.find({});
    
    console.log(`Found ${videos.length} videos:\n`);
    
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   Price: ${video.price}`);
      console.log(`   Price Display: ${video.priceDisplay}`);
      console.log(`   Category: ${video.category}`);
      console.log(`   Active: ${video.isActive}`);
      console.log(`   Featured: ${video.featured}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking pricing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

checkPricing();