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

// Creator Schema
const creatorSchema = new mongoose.Schema({
  wallet_address: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, required: true, unique: true },
  bio: { type: String, default: '' },
  profile_image_url: { type: String, default: '' },
  total_earned_usdc: { type: Number, default: 0 },
  joined_at: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  socialLinks: {
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  uploadedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  totalViews: { type: Number, default: 0 },
  followerCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

const Creator = mongoose.model('Creator', creatorSchema);

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

// Creator API Routes

// Get creator by wallet address
app.get('/api/creators/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const creator = await Creator.findOne({ 
      wallet_address: wallet.toLowerCase() 
    }).select('-__v');

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    res.status(200).json({
      success: true,
      data: creator
    });

  } catch (error) {
    console.error('Error fetching creator by wallet:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch creator data'
    });
  }
});

// Create new creator
app.post('/api/creators', async (req, res) => {
  try {
    const { wallet_address, username, bio, profile_image_url, socialLinks } = req.body;

    if (!wallet_address || !username) {
      return res.status(400).json({ 
        error: 'Missing required fields: wallet_address and username are required' 
      });
    }

    // Check if creator already exists
    const existingCreator = await Creator.findOne({
      $or: [
        { wallet_address: wallet_address.toLowerCase() },
        { username: username }
      ]
    });

    if (existingCreator) {
      return res.status(409).json({ 
        error: 'Creator already exists with this wallet address or username' 
      });
    }

    // Create new creator
    const creator = new Creator({
      wallet_address: wallet_address.toLowerCase(),
      username,
      bio,
      profile_image_url,
      socialLinks,
      joined_at: new Date(),
      total_earned_usdc: 0
    });

    await creator.save();

    console.log(`✅ New creator created: ${username} (${wallet_address})`);

    res.status(201).json({
      success: true,
      message: 'Creator created successfully',
      data: creator
    });

  } catch (error) {
    console.error('Error creating creator:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Creator with this wallet address or username already exists' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create creator'
    });
  }
});

// Video Schema
const VideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  thumbnail: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 300
  },
  category: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    default: 0
  },
  priceDisplay: {
    type: String,
    default: 'Free'
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required: true
  },
  totalViews: {
    type: Number,
    default: 0
  },
  totalUnlocks: {
    type: Number,
    default: 0
  },
  totalTipsEarned: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  isFree: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Video = mongoose.model('Video', VideoSchema);

// Video API endpoints

// Create a new video
app.post('/api/videos', async (req, res) => {
  try {
    const {
      title,
      description,
      thumbnail,
      videoUrl,
      duration,
      category,
      tags,
      price,
      priceDisplay,
      difficulty,
      creatorWallet,
      isFree
    } = req.body;

    // Validate required fields
    if (!title || !description || !thumbnail || !videoUrl || !duration || !category || !creatorWallet) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, description, thumbnail, videoUrl, duration, category, creatorWallet' 
      });
    }

    // Find the creator by wallet address
    const creator = await Creator.findOne({ wallet_address: creatorWallet.toLowerCase() });
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Create new video
    const video = new Video({
      title,
      description,
      thumbnail,
      videoUrl,
      duration,
      category,
      tags: tags || [],
      price: price || 0,
      priceDisplay: priceDisplay || 'Free',
      difficulty: difficulty || 'Beginner',
      creator: creator._id,
      isFree: isFree !== undefined ? isFree : true
    });

    await video.save();

    console.log(`✅ New video created: ${title} by ${creator.username}`);

    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      data: video
    });

  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create video'
    });
  }
});

// Get videos by creator
app.get('/api/videos/creator/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Find the creator
    const creator = await Creator.findOne({ wallet_address: wallet.toLowerCase() });
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Get videos by creator
    const videos = await Video.find({ creator: creator._id, isActive: true })
      .populate('creator', 'username profile_image_url')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: videos
    });

  } catch (error) {
    console.error('Error fetching videos by creator:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch videos'
    });
  }
});

// Get all videos
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find({ isActive: true })
      .populate('creator', 'username profile_image_url')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: videos
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch videos'
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