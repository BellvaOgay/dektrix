import { connectDB } from '../_lib/database.js';
import User from '../../src/models/User.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Helper to safely normalize wallet input
function normalizeWallet(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  // Strip surrounding quotes and whitespace, then lowercase
  const cleaned = input.replace(/^\s*["']|["']\s*$/g, '').trim().toLowerCase();
  return cleaned || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for browser calls
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
    const walletRaw = (req.query?.wallet as string) ?? '';
    const wallet = normalizeWallet(walletRaw);

    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Connect to Mongo once per cold start
    await connectDB();

    // Find user by wallet address (case insensitive)
    const user = await User.findOne({ walletAddress: wallet })
      .select('-__v')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return limited user data suitable for client consumption
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
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user by wallet:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    });
  }
}