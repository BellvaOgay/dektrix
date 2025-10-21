import { connectDB } from '../_lib/database';
import User from '../../src/models/User';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { wallet } = req.query;

    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    // Find user by wallet address (case insensitive)
    console.log('🔍 Finding user by wallet:', wallet.toLowerCase());
    const user = await User.findOne({ 
      walletAddress: wallet.toLowerCase() 
    }).select('-__v -createdAt -updatedAt');

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User found:', user.username);
    // Return user data
    res.status(200).json({
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
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching user by wallet:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
} 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch user data'
    });
  }
}