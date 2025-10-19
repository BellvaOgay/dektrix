require('dotenv').config();
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
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

const videoSchema = new mongoose.Schema({
  title: String,
  description: String,
  videoUrl: String,
  thumbnail: String,
  duration: Number,
  category: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  isFree: { type: Boolean, default: false }
});

const Category = mongoose.model('Category', categorySchema);
const Video = mongoose.model('Video', videoSchema);

async function fixVid4Categories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully\n');

    // Step 1: Fix Web3 Security category slug
    console.log('=== Step 1: Fixing Web3 Security category ===\n');
    
    const web3SecurityCategory = await Category.findOne({ name: 'web3 security' });
    if (web3SecurityCategory && !web3SecurityCategory.slug) {
      web3SecurityCategory.slug = 'web3-security';
      web3SecurityCategory.description = 'Learn essential security practices for Web3 development and smart contracts';
      web3SecurityCategory.icon = 'Lock';
      web3SecurityCategory.color = '#FF6B6B';
      await web3SecurityCategory.save();
      console.log('✅ Fixed Web3 Security category slug');
    }

    // Step 2: Create Latest Drops category
    console.log('\n=== Step 2: Creating Latest Drops category ===\n');
    
    let latestDropsCategory = await Category.findOne({ slug: 'latest-drops' });
    if (!latestDropsCategory) {
      latestDropsCategory = new Category({
        name: 'Latest Drops',
        slug: 'latest-drops',
        description: 'The newest and most exciting content on the platform',
        icon: 'Zap',
        color: '#10B981',
        featured: true,
        order: 0
      });
      await latestDropsCategory.save();
      console.log('✅ Created Latest Drops category');
    } else {
      console.log('✅ Latest Drops category already exists');
    }

    // Step 3: Find Vid4 entries
    console.log('\n=== Step 3: Finding Vid4 entries ===\n');
    
    const vid4Videos = await Video.find({
      $or: [
        { title: 'Web3 Security Fundamentals' },
        { title: 'NFT Marketplace Development' },
        { videoUrl: { $regex: /Vid4/i } }
      ]
    });

    console.log(`Found ${vid4Videos.length} Vid4 entries:`);
    vid4Videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} (ID: ${video._id})`);
      console.log(`   - Current category: ${video.category}`);
      console.log(`   - Video URL: ${video.videoUrl}`);
    });

    // Step 4: Update Vid4 categories and make them featured in Latest Drops
    console.log('\n=== Step 4: Updating Vid4 categories ===\n');
    
    for (const video of vid4Videos) {
      // Set the primary category based on content
      if (video.title.includes('Security') || video.title.includes('Web3 Security')) {
        video.category = 'web3-security';
        console.log(`✅ Set ${video.title} category to 'web3-security'`);
      } else if (video.title.includes('NFT')) {
        video.category = 'nfts';
        console.log(`✅ Set ${video.title} category to 'nfts'`);
      }
      
      // Make it featured so it appears in Latest Drops
      video.featured = true;
      video.isActive = true;
      video.isFree = true; // Make it accessible
      
      await video.save();
      console.log(`✅ Updated ${video.title} - now featured and active`);
    }

    // Step 5: Update category video counts
    console.log('\n=== Step 5: Updating category video counts ===\n');
    
    const categories = await Category.find({});
    for (const category of categories) {
      const videoCount = await Video.countDocuments({
        category: category.slug,
        isActive: true
      });
      
      category.videoCount = videoCount;
      await category.save();
      console.log(`✅ Updated ${category.name} video count: ${videoCount}`);
    }

    // Step 6: Verify the changes
    console.log('\n=== Step 6: Verification ===\n');
    
    const updatedVid4Videos = await Video.find({
      $or: [
        { title: 'Web3 Security Fundamentals' },
        { title: 'NFT Marketplace Development' },
        { videoUrl: { $regex: /Vid4/i } }
      ]
    });

    console.log('Updated Vid4 entries:');
    updatedVid4Videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   - Category: ${video.category}`);
      console.log(`   - Featured: ${video.featured}`);
      console.log(`   - Active: ${video.isActive}`);
      console.log(`   - Free: ${video.isFree}`);
    });

    // Check featured videos (for Latest Drops)
    const featuredVideos = await Video.find({ featured: true, isActive: true });
    console.log(`\n✅ Total featured videos (Latest Drops): ${featuredVideos.length}`);

    await mongoose.connection.close();
    console.log('\n✅ All changes completed successfully!');
    console.log('Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixVid4Categories();