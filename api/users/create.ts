import { connectDB } from '../_lib/database.js';
import User from '../../src/models/User.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, userData } = req.body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    // Check if user already exists
    console.log('🔍 Finding user:', walletAddress.toLowerCase());
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (user) {
      console.log('👤 User exists, updating last login');
      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      return res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
          walletAddress: user.walletAddress,
          viewCredits: user.viewCredits,
          totalTipsEarned: user.totalTipsEarned,
          totalTipsSpent: user.totalTipsSpent,
          videosWatched: user.videosWatched,
          videosUnlocked: user.videosUnlocked,
          favoriteCategories: user.favoriteCategories,
          avatar: user.avatar,
          bio: user.bio,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt
        },
        isNewUser: false
      });
    } else {
      console.log('🆕 Creating new user');
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
      console.log('✅ New user created successfully');

      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
          walletAddress: user.walletAddress,
          viewCredits: user.viewCredits,
          totalTipsEarned: user.totalTipsEarned,
          totalTipsSpent: user.totalTipsSpent,
          videosWatched: user.videosWatched,
          videosUnlocked: user.videosUnlocked,
          favoriteCategories: user.favoriteCategories,
          avatar: user.avatar,
          bio: user.bio,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt
        },
        isNewUser: true
      });
    }
  } catch (error: any) {
    console.error('❌ Error creating/getting user by wallet:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}