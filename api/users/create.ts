import { connectDB } from '../_lib/database';
import User from '../../src/models/User';

interface ApiRequest {
  method: string;
  body: { [key: string]: any };
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: any) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, userData } = req.body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    await connectDB();

    // Check if user already exists
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (user) {
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
    console.error('Error creating/getting user by wallet:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create or get user'
    });
  }
}