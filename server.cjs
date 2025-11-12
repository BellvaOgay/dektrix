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
  videosTipped: [{ type: String }],
  favoriteCategories: [{ type: String }],
  viewCredits: { type: Number, default: 1 },
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

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  type: {
    type: String,
    enum: ['unlock', 'tip', 'view', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  amountDisplay: {
    type: String,
    required: true
  },
  transactionHash: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['crypto', 'farcaster', 'credit', 'basepay'],
    required: true
  },
  metadata: {
    blockNumber: Number,
    gasUsed: Number,
    gasPrice: Number,
    basePayAmount: Number,
    basePayApplied: Boolean
  }
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);

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
      let username = userData?.username || `user_${walletAddress.slice(-8)}`;
      
      // Function to generate unique username if the requested one is taken
      const generateUniqueUsername = async (baseUsername) => {
        let counter = 1;
        let uniqueUsername = baseUsername;
        
        while (true) {
          const existingUser = await User.findOne({ username: uniqueUsername });
          if (!existingUser) {
            return uniqueUsername;
          }
          uniqueUsername = `${baseUsername}${counter}`;
          counter++;
        }
      };
      
      // Generate a unique username
      username = await generateUniqueUsername(username);

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
        viewCredits: 1, // Give new users 1 free credit to start
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
    const { walletAddress, creditsToAdd, amount } = req.body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address is required' 
      });
    }

    // Support both 'creditsToAdd' and 'amount' parameters for backward compatibility
    const credits = creditsToAdd || amount;
    
    if (!credits || typeof credits !== 'number' || credits <= 0) {
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
    const add = Math.max(credits, 0);
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

// Get user credits by wallet address
app.get('/api/users/:wallet/credits', async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!wallet) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address is required' 
      });
    }

    const user = await User.findOne({ 
      walletAddress: wallet.toLowerCase() 
    }).select('walletAddress username viewCredits');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        walletAddress: user.walletAddress,
        username: user.username,
        viewCredits: user.viewCredits || 0
      }
    });

  } catch (error) {
    console.error('Error fetching user credits:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch user credits'
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
  tipAmount: {
    type: Number,
    default: 100000, // Fixed 0.1 USDC in wei (6 decimals)
    required: true
  },
  tipAmountDisplay: {
    type: String,
    default: "0.1 USDC",
    required: true
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
      isFree: isFree !== undefined ? isFree : false // All videos locked by default
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

// Get video by filename (e.g., Ep5.mp4)
app.get('/api/videos/filename/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Find video by filename (case-insensitive search)
    const video = await Video.findOne({ 
      $or: [
        { videoUrl: { $regex: filename, $options: 'i' } },
        { title: { $regex: filename, $options: 'i' } }
      ],
      isActive: true
    }).populate('creator', 'username profile_image_url');

    if (!video) {
      return res.status(404).json({ 
        success: false,
        error: 'Video not found',
        message: `Video with filename '${filename}' not found`
      });
    }

    res.status(200).json({
      success: true,
      data: video
    });

  } catch (error) {
    console.error('Error fetching video by filename:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch video'
    });
  }
});

// Deduct credit when video starts playing
app.post('/api/videos/deduct-credit', async (req, res) => {
  try {
    const { walletAddress, videoId } = req.body;

    // Validate required fields
    if (!walletAddress || !videoId) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress and videoId are required' 
      });
    }

    // Find user
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has sufficient credits
    if (user.viewCredits < 1) {
      return res.status(400).json({ 
        error: 'Insufficient view credits',
        remainingCredits: 0
      });
    }

    // Find video
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Deduct one credit for each view (allow multiple views of same video)
    user.viewCredits -= 1;
    
    // Track total views for analytics (but allow rewatching)
    if (!user.totalVideoViews) {
      user.totalVideoViews = 0;
    }
    user.totalVideoViews += 1;
    
    await user.save();

    console.log(`✅ Credit deducted for user ${walletAddress} watching video ${video.title}. Remaining credits: ${user.viewCredits}`);

    res.status(200).json({
      success: true,
      message: 'Credit deducted successfully',
      remainingCredits: user.viewCredits,
      transaction: {
        type: 'credit_deduction',
        videoId: videoId,
        videoTitle: video.title,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error deducting credit:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to deduct credit'
    });
  }
});

// Increment video view count
app.post('/api/videos/:videoId/view', async (req, res) => {
  try {
    const { videoId } = req.params;

    // Validate video ID
    if (!videoId) {
      return res.status(400).json({ 
        error: 'Video ID is required' 
      });
    }

    // Find and update video
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Increment view count
    video.totalViews += 1;
    
    // Handle videos with missing required fields (like creator)
    try {
      await video.save();
    } catch (saveError) {
      if (saveError.name === 'ValidationError') {
        // If validation fails due to missing required fields, 
        // use updateOne to bypass validation and just update totalViews
        await Video.updateOne(
          { _id: videoId },
          { $inc: { totalViews: 1 } }
        );
        console.log(`⚠️  View count incremented (bypassed validation) for video: ${video.title}`);
      } else {
        throw saveError;
      }
    }

    console.log(`✅ View count incremented for video: ${video.title} (Total views: ${video.totalViews})`);

    res.status(200).json({
      success: true,
      message: 'View count incremented successfully',
      data: {
        videoId: video._id,
        title: video.title,
        totalViews: video.totalViews
      }
    });

  } catch (error) {
    console.error('Error incrementing video view:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to increment view count'
    });
  }
});

// Increment video play count
app.post('/api/videos/increment-play-count', async (req, res) => {
  try {
    const { videoId } = req.body;

    // Validate video ID
    if (!videoId) {
      return res.status(400).json({ 
        error: 'Video ID is required' 
      });
    }

    // Find and update video
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Increment play count
    video.playCount = (video.playCount || 0) + 1;
    await video.save();

    console.log(`✅ Play count incremented for video: ${video.title} (Total plays: ${video.playCount})`);

    res.status(200).json({
      success: true,
      message: 'Play count incremented successfully',
      data: {
        videoId: video._id,
        title: video.title,
        playCount: video.playCount
      }
    });

  } catch (error) {
    console.error('Error incrementing video play count:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to increment play count'
    });
  }
});

// Transaction API Routes

// Process tip transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const { fromUserId, videoId, transactionData } = req.body;

    if (!fromUserId || !videoId || !transactionData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: fromUserId, videoId, and transactionData are required' 
      });
    }

    // Find the user who is tipping
    const fromUser = await User.findById(fromUserId);
    if (!fromUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Find the video being tipped
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        error: 'Video not found' 
      });
    }

    // Find the video creator (from Creator model, not User model)
    const videoCreator = await Creator.findById(video.creator);
    if (!videoCreator) {
      return res.status(404).json({ 
        success: false, 
        error: 'Video creator not found' 
      });
    }

    // Find the user account associated with the creator's wallet
    const toUser = await User.findOne({ walletAddress: videoCreator.wallet_address.toLowerCase() });
    if (!toUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'Creator user account not found' 
      });
    }

    // Fixed tip amount of 0.1 USDC
    const tipAmount = 0.1;
    let finalAmount = tipAmount;
    let basePayAmount = 0;
    let basePayApplied = false;

    // Apply BasePay if specified
    if (transactionData.paymentMethod === 'basepay') {
      // BasePay logic: 50% discount
      basePayAmount = tipAmount * 0.5;
      finalAmount = tipAmount - basePayAmount;
      basePayApplied = true;
    }

    // Create transaction record
    let Transaction;
    try {
      Transaction = mongoose.model('Transaction');
    } catch (error) {
      // Model doesn't exist, create it
      Transaction = mongoose.model('Transaction', new mongoose.Schema({
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
        type: { type: String, required: true },
        amount: { type: Number, required: true },
        amountDisplay: { type: String, required: true },
        finalAmount: { type: Number, required: true },
        basePayAmount: { type: Number, default: 0 },
        basePayApplied: { type: Boolean, default: false },
        paymentMethod: { type: String, default: 'crypto' },
        transactionHash: { type: String },
        status: { type: String, default: 'completed' },
        metadata: { type: mongoose.Schema.Types.Mixed },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      }));
    }

    const transaction = new Transaction({
      user: fromUserId,
      video: videoId,
      type: 'tip',
      amount: tipAmount,
      amountDisplay: `${tipAmount} USDC`,
      finalAmount,
      basePayAmount,
      basePayApplied,
      paymentMethod: transactionData.paymentMethod || 'crypto',
      transactionHash: transactionData.transactionHash,
      status: 'completed',
      metadata: {
        toUserId: toUser._id,
        ...transactionData.metadata
      }
    });

    await transaction.save();

    // Update user balances
    fromUser.totalTipsSpent = (fromUser.totalTipsSpent || 0) + finalAmount;
    toUser.totalTipsEarned = (toUser.totalTipsEarned || 0) + finalAmount;

    // Update video statistics
    video.totalTips = (video.totalTips || 0) + 1;
    video.totalTipAmount = (video.totalTipAmount || 0) + finalAmount;

    // Save all updates
    await Promise.all([
      fromUser.save(),
      toUser.save(),
      video.save()
    ]);

    console.log(`✅ Tip processed: ${finalAmount} USDC from ${fromUser.username} to ${toUser.username} for video ${video.title}`);

    return res.status(200).json({
      success: true,
      data: {
        transaction,
        finalAmount,
        basePayAmount,
        basePayApplied,
        message: `Successfully tipped ${finalAmount} USDC`
      }
    });

  } catch (error) {
    console.error('❌ Error processing tip:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to process tip' 
    });
  }
});

// Video unlock endpoint
app.post('/api/video-unlock', async (req, res) => {
  try {
    const { userId, videoId, transactionHash, paymentMethod, amount, amountDisplay } = req.body;

    // Validate required fields
    if (!userId || !videoId || !transactionHash || !paymentMethod || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: userId, videoId, transactionHash, paymentMethod, amount' 
      });
    }

    // Validate amount is either 0.1 USDC (100000 wei) or 1 USDC (1000000 wei)
    if (amount !== 100000 && amount !== 1000000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid amount. Videos require either 0.1 USDC (100000 wei) or 1 USDC (1000000 wei)' 
      });
    }
    
    // Calculate view credits based on payment amount
    let viewCreditsToAdd = 0;
    if (amount === 100000) {
      viewCreditsToAdd = 1; // 0.1 USDC = 1 view credit
    } else if (amount === 1000000) {
      viewCreditsToAdd = 12; // 1 USDC = 12 view credits
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if already unlocked
    if (user.videosUnlocked.includes(videoId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Video already unlocked' 
      });
    }

    // Check if transaction hash already exists (prevent double spending)
    const existingTransaction = await Transaction.findOne({ transactionHash });
    if (existingTransaction) {
      return res.status(400).json({ 
        success: false, 
        error: 'Transaction already processed' 
      });
    }

    let finalAmount = amount;
    let basePayAmount = 0;
    let basePayApplied = false;

    // Apply BasePay if using basepay payment method
    if (paymentMethod === 'basepay') {
      // BasePay logic: 50% discount
      basePayAmount = amount * 0.5;
      finalAmount = amount - basePayAmount;
      basePayApplied = true;
    }

    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      video: videoId,
      type: 'unlock',
      amount: finalAmount,
      amountDisplay: amountDisplay || '0.1 USDC',
      paymentMethod,
      transactionHash,
      status: 'completed',
      metadata: {
        basePayAmount,
        basePayApplied,
        originalAmount: amount
      }
    });

    await transaction.save();

    // Update user's unlocked videos and add view credits
    user.videosUnlocked.push(videoId);
    user.viewCredits = (user.viewCredits || 0) + viewCreditsToAdd;
    await user.save();

    // Update video stats
    video.totalUnlocks += 1;
    await video.save();

    return res.status(200).json({
      success: true,
      data: {
        message: 'Video unlocked successfully',
        transaction: {
          id: transaction._id,
          type: transaction.type,
          amount: transaction.amount,
          amountDisplay: transaction.amountDisplay,
          paymentMethod: transaction.paymentMethod,
          transactionHash: transaction.transactionHash,
          status: transaction.status
        },
        video: {
          id: video._id,
          title: video.title,
          totalUnlocks: video.totalUnlocks
        },
        user: {
          id: user._id,
          unlockedVideosCount: user.videosUnlocked.length,
          viewCredits: user.viewCredits,
          creditsAdded: viewCreditsToAdd
        }
      }
    });

  } catch (error) {
    console.error('Error processing video unlock:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: ' + error.message 
    });
  }
});

// Check video unlock status for user
app.get('/api/user/:userId/video/:videoId/unlock-status', async (req, res) => {
  try {
    const { userId, videoId } = req.params;

    if (!userId || !videoId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: userId and videoId' 
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    // Check if video is free
    if (video.isFree) {
      return res.status(200).json({
        success: true,
        data: {
          isUnlocked: true,
          reason: 'free_video',
          requiresPayment: false
        }
      });
    }

    // Check if user has unlocked this video
    const isUnlocked = user.videosUnlocked.includes(videoId);

    return res.status(200).json({
      success: true,
      data: {
        isUnlocked,
        reason: isUnlocked ? 'purchased' : 'locked',
        requiresPayment: !isUnlocked,
        price: video.price || 100000, // Default to 0.1 USDC in wei
        priceDisplay: video.priceDisplay || '0.1 USDC'
      }
    });

  } catch (error) {
    console.error('Error checking video unlock status:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: ' + error.message 
    });
  }
});

// Get user's unlocked videos
app.get('/api/user/:userId/unlocked-videos', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameter: userId' 
      });
    }

    const user = await User.findById(userId)
      .populate({
        path: 'videosUnlocked',
        populate: {
          path: 'creator',
          select: 'username displayName avatar wallet_address'
        }
      })
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Add unlock status to each video
    const unlockedVideos = user.videosUnlocked.map((video) => ({
      ...video,
      isUnlocked: true,
      unlockReason: 'purchased'
    }));

    return res.status(200).json({
      success: true,
      data: {
        unlockedVideos,
        totalUnlocked: unlockedVideos.length,
        userId: user._id
      }
    });

  } catch (error) {
    console.error('Error fetching user unlocked videos:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: ' + error.message 
    });
  }
});

// Get Ep6 video endpoint
app.get('/api/videos/ep6', async (req, res) => {
  try {
    // Find Ep6 video by title (case insensitive search for Ep6)
    const ep6Video = await Video.findOne({
      $or: [
        { title: { $regex: /Ep6/i } },
        { filename: { $regex: /Ep6\.mp4$/i } }
      ],
      isActive: true
    })
    .populate('creator', 'username displayName avatar')
    .lean();

    if (!ep6Video) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ep6 video not found' 
      });
    }

    // Format the response with all necessary video details
    const response = {
      success: true,
      data: {
        _id: ep6Video._id,
        title: ep6Video.title,
        description: ep6Video.description || 'Ep6 - The Next Chapter',
        videoUrl: ep6Video.videoUrl,
        thumbnail: ep6Video.thumbnail || '/placeholder.svg',
        duration: ep6Video.duration || 0,
        category: ep6Video.category || 'Blockchain',
        price: ep6Video.price || 100000, // Default to 0.1 USDC if not set
        priceDisplay: ep6Video.priceDisplay || '0.1 USDC',
        isFree: ep6Video.isFree || false,
        isUnlocked: ep6Video.isUnlocked || false,
        totalViews: ep6Video.totalViews || 0,
        totalUnlocks: ep6Video.totalUnlocks || 0,
        createdAt: ep6Video.createdAt,
        creator: ep6Video.creator ? {
          _id: ep6Video.creator._id,
          username: ep6Video.creator.username,
          displayName: ep6Video.creator.displayName,
          avatar: ep6Video.creator.avatar
        } : null,
        // Additional metadata
        shouldBeLocked: !ep6Video.isFree && (ep6Video.price > 0),
        isEp6: true
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching Ep6 video:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch Ep6 video' 
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