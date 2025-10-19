const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektirk';

// User Schema (matching the actual model)
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
  displayName: String,
  avatar: String,
  bio: String,
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

// Simulate the createOrGetUserByWallet function
async function createOrGetUserByWallet(walletAddress, userData = {}) {
  try {
    console.log('🔍 Looking for user with wallet:', walletAddress.toLowerCase());

    // Check if user already exists
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (user) {
      console.log('👤 User found:', {
        id: user._id,
        username: user.username,
        walletAddress: user.walletAddress
      });
      
      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      return {
        success: true,
        data: user,
        isNewUser: false
      };
    } else {
      console.log('🆕 Creating new user...');
      
      // Create new user with wallet address
      const username = userData?.username || `user_${walletAddress.slice(-8)}`;

      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        username: username,
        displayName: userData?.displayName || username,
        avatar: userData?.avatar || '',
        bio: userData?.bio || '',
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

      const savedUser = await user.save();
      console.log('✅ New user created:', {
        id: savedUser._id,
        username: savedUser.username,
        walletAddress: savedUser.walletAddress
      });

      return {
        success: true,
        data: savedUser,
        isNewUser: true
      };
    }
  } catch (error) {
    console.error('❌ Error in createOrGetUserByWallet:', error);
    
    // Check for specific error types
    if (error.code === 11000) {
      console.error('🔍 Duplicate key error - user might already exist');
      console.error('Error details:', error.keyPattern, error.keyValue);
    }
    
    if (error.name === 'ValidationError') {
      console.error('🔍 Validation error:', error.errors);
    }
    
    return {
      success: false,
      error: error.message || 'Failed to create or get user by wallet address'
    };
  }
}

async function testUserCreationScenarios() {
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

    // Test scenarios that might cause "user not found" issues
    const testWallets = [
      '0x1234567890123456789012345678901234567890', // Standard format
      '0X1234567890123456789012345678901234567890', // Uppercase X
      '0x1234567890123456789012345678901234567890'.toUpperCase(), // All uppercase
      '0x1234567890123456789012345678901234567891', // Different address
    ];

    for (const wallet of testWallets) {
      console.log(`\n🧪 Testing wallet: ${wallet}`);
      
      const result = await createOrGetUserByWallet(wallet);
      
      console.log('📊 Result:', {
        success: result.success,
        isNewUser: result.isNewUser,
        hasData: !!result.data,
        error: result.error
      });
      
      if (result.success && result.data) {
        console.log('✅ User operation successful');
        
        // Verify the user can be found again
        const verifyResult = await createOrGetUserByWallet(wallet);
        if (verifyResult.success && !verifyResult.isNewUser) {
          console.log('✅ User verification successful');
        } else {
          console.error('❌ User verification failed - this could cause "user not found" errors');
        }
      } else {
        console.error('❌ User operation failed:', result.error);
      }
      
      console.log('---');
    }

    // Test edge cases
    console.log('\n🔬 Testing edge cases...');
    
    // Empty wallet address
    try {
      const emptyResult = await createOrGetUserByWallet('');
      console.log('Empty wallet result:', emptyResult);
    } catch (error) {
      console.log('Empty wallet error (expected):', error.message);
    }
    
    // Invalid wallet address
    try {
      const invalidResult = await createOrGetUserByWallet('invalid-address');
      console.log('Invalid wallet result:', invalidResult);
    } catch (error) {
      console.log('Invalid wallet error:', error.message);
    }

    console.log('\n🎯 Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testUserCreationScenarios();