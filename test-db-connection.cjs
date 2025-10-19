const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektirk';

// User Schema (simplified for testing)
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  totalTipsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  totalTipsSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  videosWatched: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  videosUnlocked: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  favoriteCategories: [{
    type: String
  }],
  userContainer: {
    purchasedVideos: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video'
    }],
    uploadedVideos: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video'
    }],
    watchHistory: [{
      videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
      },
      watchedAt: {
        type: Date,
        default: Date.now
      },
      progress: {
        type: Number,
        default: 0
      }
    }],
    preferences: {
      autoPlay: {
        type: Boolean,
        default: true
      },
      notifications: {
        type: Boolean,
        default: true
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto'
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', UserSchema);

async function testDatabaseConnection() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
    });
    console.log('✅ Connected to MongoDB successfully');

    // Test wallet address
    const testWalletAddress = '0x1234567890123456789012345678901234567890';
    
    console.log('🔍 Testing user creation/retrieval...');
    
    // Check if user exists
    let user = await User.findOne({ walletAddress: testWalletAddress.toLowerCase() });
    
    if (user) {
      console.log('👤 User already exists:', {
        id: user._id,
        username: user.username,
        walletAddress: user.walletAddress,
        lastLoginAt: user.lastLoginAt
      });
      
      // Update last login
      user.lastLoginAt = new Date();
      await user.save();
      console.log('✅ Updated last login time');
    } else {
      console.log('🆕 Creating new user...');
      
      const username = `user_${testWalletAddress.slice(-8)}`;
      
      user = new User({
        walletAddress: testWalletAddress.toLowerCase(),
        username: username,
        displayName: username,
        avatar: '',
        bio: '',
        totalTipsEarned: 0,
        totalTipsSpent: 0,
        videosWatched: [],
        videosUnlocked: [],
        favoriteCategories: [],
        userContainer: {
          purchasedVideos: [],
          uploadedVideos: [],
          watchHistory: [],
          preferences: {
            autoPlay: true,
            notifications: true,
            theme: 'auto'
          }
        },
        isActive: true,
        lastLoginAt: new Date()
      });

      await user.save();
      console.log('✅ New user created successfully:', {
        id: user._id,
        username: user.username,
        walletAddress: user.walletAddress
      });
    }

    console.log('🧪 Database connection and user operations test completed successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    if (error.code === 11000) {
      console.error('🔍 Duplicate key error - user might already exist with different case');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testDatabaseConnection();