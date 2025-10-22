require('dotenv').config();
const mongoose = require('mongoose');

// Creator schema (simplified for checking)
const CreatorSchema = new mongoose.Schema({
  wallet_address: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  bio: String,
  profile_image_url: String,
  total_earned_usdc: { type: Number, default: 0 },
  joined_at: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  socialLinks: {
    twitter: String,
    instagram: String,
    youtube: String,
    website: String
  },
  uploadedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  totalViews: { type: Number, default: 0 },
  followerCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

const Creator = mongoose.model('Creator', CreatorSchema);

async function checkCreators() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const creators = await Creator.find({});
    console.log(`Found ${creators.length} creators in database:`);
    
    creators.forEach((creator, index) => {
      console.log(`${index + 1}. Username: ${creator.username}`);
      console.log(`   Wallet: ${creator.wallet_address}`);
      console.log(`   Bio: ${creator.bio || 'No bio'}`);
      console.log(`   Verified: ${creator.isVerified}`);
      console.log(`   Active: ${creator.isActive}`);
      console.log(`   Total Earned: $${creator.total_earned_usdc}`);
      console.log(`   Joined: ${creator.joined_at || creator.createdAt}`);
      console.log('');
    });

    console.log('Database connection closed');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCreators();