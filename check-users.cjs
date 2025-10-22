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

async function checkUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find();
    
    console.log(`Found ${users.length} users in database:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Wallet: ${user.walletAddress}`);
      console.log(`   Credits: ${user.viewCredits}`);
      console.log(`   Videos Watched: ${user.videosWatched.length}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();