import { connectDB } from '../_lib/database';
import User from '../../src/models/User';

interface ApiRequest {
  method: string;
  query: { [key: string]: string | string[] | undefined };
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: any) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { wallet } = req.query;

    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    await connectDB();

    // Find user by wallet address (case insensitive)
    const user = await User.findOne({ 
      walletAddress: wallet.toLowerCase() 
    }).select('-__v -createdAt -updatedAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

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
    console.error('Error fetching user by wallet:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch user data'
    });
  }
}