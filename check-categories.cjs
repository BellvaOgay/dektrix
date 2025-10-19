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

const Category = mongoose.model('Category', categorySchema);

async function checkCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully\n');

    console.log('=== Checking all categories ===\n');

    const categories = await Category.find({}).sort({ order: 1, name: 1 });
    
    if (categories.length === 0) {
      console.log('No categories found in database\n');
    } else {
      console.log(`Found ${categories.length} categories:\n`);
      categories.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name}`);
        console.log(`   - Slug: ${category.slug}`);
        console.log(`   - Active: ${category.isActive}`);
        console.log(`   - Featured: ${category.featured}`);
        console.log(`   - Video Count: ${category.videoCount}`);
        console.log(`   - Order: ${category.order}`);
        console.log();
      });
    }

    // Check specifically for "Latest Drops" and "Web3 Security"
    console.log('=== Checking for specific categories ===\n');
    
    const latestDrops = await Category.findOne({ 
      $or: [
        { slug: 'latest-drops' },
        { name: { $regex: /latest.*drops/i } }
      ]
    });
    
    if (latestDrops) {
      console.log('✅ Latest Drops category found:');
      console.log(`   - Name: ${latestDrops.name}`);
      console.log(`   - Slug: ${latestDrops.slug}`);
    } else {
      console.log('❌ Latest Drops category not found');
    }

    const web3Security = await Category.findOne({ 
      $or: [
        { slug: 'web3-security' },
        { name: { $regex: /web3.*security/i } }
      ]
    });
    
    if (web3Security) {
      console.log('✅ Web3 Security category found:');
      console.log(`   - Name: ${web3Security.name}`);
      console.log(`   - Slug: ${web3Security.slug}`);
    } else {
      console.log('❌ Web3 Security category not found');
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCategories();