require('dotenv').config();
const mongoose = require('mongoose');

// User schema
const userSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  viewCredits: { type: Number, default: 0 },
  videosWatched: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function addCreditsToUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Add credits to a specific user (or create if doesn't exist)
    const walletAddress = '0x50d2c99358c9d3671869b75ceee269f2f393e179';
    const creditsToAdd = 5;

    const user = await User.findOneAndUpdate(
      { walletAddress },
      { 
        $inc: { viewCredits: creditsToAdd },
        $set: { updatedAt: new Date() }
      },
      { 
        new: true, 
        upsert: true 
      }
    );

    console.log(`✅ Added ${creditsToAdd} credits to user:`);
    console.log(`   Wallet: ${user.walletAddress}`);
    console.log(`   Total Credits: ${user.viewCredits}`);
    console.log(`   Videos Watched: ${user.videosWatched.length}`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addCreditsToUser();