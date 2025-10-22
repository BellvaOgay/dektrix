require('dotenv').config();
const mongoose = require('mongoose');

// Video Schema
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

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: String,
  bio: String,
  isCreator: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function addVid4ToDektirk() {
  try {
    // Connect to dektirk database specifically
    const dektirkUri = process.env.MONGODB_URI.replace('/dektrix', '/dektirk');
    console.log('🔗 Connecting to dektirk database...');
    await mongoose.connect(dektirkUri);
    console.log('✅ Connected to dektirk database');

    // Find or create a test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        name: 'Test Creator',
        email: 'test@example.com',
        avatar: '/placeholder.svg',
        bio: 'Test creator for video content',
        isCreator: true
      });
      await testUser.save();
      console.log('✅ Created test user');
    }

    // Check if Vid4 already exists
    const existingVid4 = await Video.findOne({ 
      $or: [
        { title: 'Web3 Security Fundamentals' },
        { videoUrl: '/videos/Vid4.mp4' }
      ]
    });

    if (existingVid4) {
      console.log('⚠️  Vid4 already exists in dektirk database');
      return;
    }

    // Add Vid4
    const vid4 = new Video({
      title: 'Web3 Security Fundamentals',
      description: 'Learn essential security practices for Web3 development and smart contract auditing.',
      thumbnail: '/placeholder.svg',
      videoUrl: '/videos/Vid4.mp4',
      duration: 240,
      category: 'Blockchain',
      tags: ['Web3', 'Security', 'Smart Contracts', 'Auditing'],
      price: 0,
      priceDisplay: 'Free',
      difficulty: 'Intermediate',
      creator: testUser._id,
      isFree: true,
      isActive: true
    });

    await vid4.save();
    console.log('✅ Added Vid4: Web3 Security Fundamentals');

    // Verify final count
    const totalVideos = await Video.countDocuments();
    console.log(`📊 Total videos in dektirk database: ${totalVideos}`);

    // List all videos
    const allVideos = await Video.find({}, 'title videoUrl').sort({ title: 1 });
    console.log('\n📋 All videos in dektirk database:');
    allVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} - ${video.videoUrl}`);
    });

    console.log('\n✅ Vid4 successfully added to dektirk database!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('🔌 Database connection closed');
    await mongoose.connection.close();
  }
}

addVid4ToDektirk();