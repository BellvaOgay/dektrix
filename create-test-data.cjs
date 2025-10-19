require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektirk';

// Define schemas
const VideoSchema = new mongoose.Schema({
  title: String,
  description: String,
  thumbnail: String,
  videoUrl: String,
  duration: Number,
  category: String,
  tags: [String],
  price: Number,
  priceDisplay: String,
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalViews: { type: Number, default: 0 },
  totalUnlocks: { type: Number, default: 0 },
  totalTipsEarned: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  isFree: { type: Boolean, default: false }
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  icon: String,
  color: String,
  videoCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  username: String,
  displayName: String,
  avatar: String,
  walletAddress: String
}, { timestamps: true });

const Video = mongoose.model('Video', VideoSchema);
const Category = mongoose.model('Category', CategorySchema);
const User = mongoose.model('User', UserSchema);

async function createTestData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create test user first
    let testUser = await User.findOne({ username: 'test_user' });
    if (!testUser) {
      // Check if wallet address already exists
      const existingWallet = await User.findOne({ walletAddress: '0x1234567890123456789012345678901234567890' });
      if (existingWallet) {
        testUser = existingWallet;
        console.log('👤 Using existing user with same wallet address');
      } else {
        testUser = new User({
          username: 'test_user',
          displayName: 'Test User',
          avatar: '/placeholder.svg',
          walletAddress: '0x1234567890123456789012345678901234567890'
        });
        await testUser.save();
        console.log('👤 Created test user');
      }
    } else {
      console.log('👤 Test user already exists');
    }

    // Create test categories
    const testCategories = [
      {
        name: 'AI Agents',
        slug: 'ai-agents',
        description: 'Learn about AI agents and automation',
        icon: '🤖',
        color: '#3B82F6',
        order: 1
      },
      {
        name: 'DeFi',
        slug: 'defi',
        description: 'Decentralized Finance protocols and strategies',
        icon: '💰',
        color: '#10B981',
        order: 2
      },
      {
        name: 'Blockchain',
        slug: 'blockchain',
        description: 'Blockchain technology fundamentals',
        icon: '⛓️',
        color: '#8B5CF6',
        order: 3
      }
    ];

    for (const categoryData of testCategories) {
      const existingCategory = await Category.findOne({ slug: categoryData.slug });
      if (!existingCategory) {
        const category = new Category(categoryData);
        await category.save();
        console.log(`📂 Created category: ${categoryData.name}`);
      } else {
        console.log(`📂 Category already exists: ${categoryData.name}`);
      }
    }

    // Create test videos
    const testVideos = [
      {
        title: 'Introduction to AI Agents',
        description: 'Learn the basics of AI agents and how they work',
        thumbnail: '/placeholder.svg',
        videoUrl: '/videos/Vid1.mp4',
        duration: 180,
        category: 'ai-agents',
        tags: ['AI', 'Agents', 'Beginner'],
        price: 1000000000000000, // 0.001 ETH in wei
        priceDisplay: '$0.01',
        difficulty: 'Beginner',
        creator: testUser._id,
        isFree: false
      },
      {
        title: 'DeFi Fundamentals',
        description: 'Understanding decentralized finance protocols',
        thumbnail: '/placeholder.svg',
        videoUrl: '/videos/Vid2.mp4',
        duration: 240,
        category: 'defi',
        tags: ['DeFi', 'Finance', 'Protocols'],
        price: 2000000000000000, // 0.002 ETH in wei
        priceDisplay: '$0.02',
        difficulty: 'Intermediate',
        creator: testUser._id,
        isFree: false
      },
      {
        title: 'Blockchain Basics',
        description: 'Learn the fundamentals of blockchain technology',
        thumbnail: '/placeholder.svg',
        videoUrl: '/videos/Vid3.mp4',
        duration: 200,
        category: 'blockchain',
        tags: ['Blockchain', 'Technology', 'Basics'],
        price: 0,
        priceDisplay: 'Free',
        difficulty: 'Beginner',
        creator: testUser._id,
        isFree: true
      }
    ];

    for (const videoData of testVideos) {
      const existingVideo = await Video.findOne({ title: videoData.title });
      if (!existingVideo) {
        const video = new Video(videoData);
        await video.save();
        console.log(`📹 Created video: ${videoData.title}`);
      } else {
        console.log(`📹 Video already exists: ${videoData.title}`);
      }
    }

    // Update category video counts
    const categories = await Category.find();
    for (const category of categories) {
      const videoCount = await Video.countDocuments({
        category: category.slug,
        isActive: true
      });
      await Category.findByIdAndUpdate(category._id, { videoCount });
      console.log(`📊 Updated ${category.name} video count: ${videoCount}`);
    }

    console.log('\n✅ Test data creation completed successfully!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestData();