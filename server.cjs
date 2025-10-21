const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dektrix', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, required: true },
  displayName: { type: String, default: '' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  totalTipsEarned: { type: Number, default: 0 },
  totalTipsSpent: { type: Number, default: 0 },
  videosWatched: [{ type: String }],
  videosUnlocked: [{ type: String }],
  favoriteCategories: [{ type: String }],
  viewCredits: { type: Number, default: 10 },
  userContainer: {
    purchasedVideos: [{ type: String }],
    uploadedVideos: [{ type: String }],
    watchHistory: [{
      videoId: String,
      watchedAt: { type: Date, default: Date.now }
    }],
    preferences: {
      autoPlay: { type: Boolean, default: true },
      notifications: { type: Boolean, default: true },
      theme: { type: String, default: 'auto' }
    }
  },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// API Routes

// Get user by wallet address
app.get('/api/users/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const user = await User.findOne({ 
      walletAddress: wallet.toLowerCase() 
    }).select('-__v -createdAt -updatedAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error fetching user by wallet:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch user data'
    });
  }
});

// Create or get user by wallet address
app.post('/api/users/create', async (req, res) => {
  try {
    const { walletAddress, userData } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Check if user already exists
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (user) {
      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      return res.status(200).json({
        success: true,
        data: user,
        isNewUser: false
      });
    } else {
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
        viewCredits: 10, // Give new users 10 free credits to start
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

      return res.status(201).json({
        success: true,
        data: user,
        isNewUser: true
      });
    }
  } catch (error) {
    console.error('Error creating/getting user by wallet:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create or get user'
    });
  }
});

// Add view credits to user
app.post('/api/users/add-credits', async (req, res) => {
  try {
    const { walletAddress, creditsToAdd } = req.body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address is required' 
      });
    }

    if (!creditsToAdd || typeof creditsToAdd !== 'number' || creditsToAdd <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid credits amount is required' 
      });
    }

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Add credits to user
    const add = Math.max(creditsToAdd, 0);
    user.viewCredits = (user.viewCredits || 0) + add;
    await user.save();

    console.log(`✅ Added ${add} credits to user ${walletAddress}. New balance: ${user.viewCredits}`);

    return res.status(200).json({
      success: true,
      data: {
        viewCredits: user.viewCredits,
        creditsAdded: add,
        user: {
          _id: user._id,
          username: user.username,
          walletAddress: user.walletAddress,
          viewCredits: user.viewCredits
        }
      }
    });

  } catch (error) {
    console.error('❌ Error adding view credits:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to add view credits' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  });
};

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});