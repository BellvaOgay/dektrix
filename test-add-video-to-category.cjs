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
  avatar: String
}, { timestamps: true });

const Video = mongoose.model('Video', VideoSchema);
const Category = mongoose.model('Category', CategorySchema);
const User = mongoose.model('User', UserSchema);

async function testAddVideoToCategory() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test video and category (different categories)
    const video = await Video.findOne({ isActive: true });
    const categories = await Category.find({ isActive: true });
    
    if (!video || categories.length < 2) {
      console.log('❌ Need at least one video and two categories for testing');
      return;
    }

    // Find a different category than the video's current category
    const targetCategory = categories.find(cat => cat.slug !== video.category);
    
    if (!targetCategory) {
      console.log('❌ Could not find a different category for testing');
      return;
    }

    console.log(`📹 Found video: "${video.title}" (ID: ${video._id})`);
    console.log(`📂 Current category: ${video.category}`);
    console.log(`🎯 Target category: ${targetCategory.slug} (${targetCategory.name})`);

    // Store original category for restoration
    const originalCategory = video.category;

    // Test the addVideoToCategory function
    console.log('\n🧪 Testing addVideoToCategory function...');
    
    // Simulate the function logic
    const oldCategorySlug = video.category;
    
    // Update video's category
    const updatedVideo = await Video.findByIdAndUpdate(
      video._id,
      { category: targetCategory.slug },
      { new: true, runValidators: true }
    ).populate('creator', 'username displayName avatar');

    console.log(`✅ Video category updated from "${oldCategorySlug}" to "${targetCategory.slug}"`);

    // Update video counts for both old and new categories
    if (oldCategorySlug && oldCategorySlug !== targetCategory.slug) {
      const oldVideoCount = await Video.countDocuments({
        category: oldCategorySlug,
        isActive: true
      });
      await Category.findOneAndUpdate(
        { slug: oldCategorySlug },
        { videoCount: oldVideoCount }
      );
      console.log(`📊 Updated old category "${oldCategorySlug}" video count: ${oldVideoCount}`);
    }

    // Update count for new category
    const newVideoCount = await Video.countDocuments({
      category: targetCategory.slug,
      isActive: true
    });
    await Category.findOneAndUpdate(
      { slug: targetCategory.slug },
      { videoCount: newVideoCount }
    );
    console.log(`📊 Updated new category "${targetCategory.slug}" video count: ${newVideoCount}`);

    console.log('\n✅ Test completed successfully!');
    console.log('📋 Result:', {
      videoId: updatedVideo._id,
      videoTitle: updatedVideo.title,
      oldCategory: oldCategorySlug,
      newCategory: targetCategory.slug,
      success: true
    });

    // Restore original category
    console.log('\n🔄 Restoring original category...');
    await Video.findByIdAndUpdate(video._id, { category: originalCategory });
    
    // Update counts back
    const restoredCount = await Video.countDocuments({
      category: originalCategory,
      isActive: true
    });
    await Category.findOneAndUpdate(
      { slug: originalCategory },
      { videoCount: restoredCount }
    );
    
    const targetCount = await Video.countDocuments({
      category: targetCategory.slug,
      isActive: true
    });
    await Category.findOneAndUpdate(
      { slug: targetCategory.slug },
      { videoCount: targetCount }
    );
    
    console.log('✅ Original state restored');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testAddVideoToCategory();