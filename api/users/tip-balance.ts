import { connectDB } from '../_lib/database';
import User from '../../src/models/User';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { walletAddress } = req.query;

  if (!walletAddress || typeof walletAddress !== 'string') {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    await connectDB();

    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Convert from wei to USDC (6 decimals)
    const balanceInUSDC = user.totalTipsEarned / 1000000;
    const canWithdraw = user.totalTipsEarned >= 5000000; // 5 USDC minimum

    return res.status(200).json({
      success: true,
      data: {
        walletAddress: user.walletAddress,
        totalTipsEarned: user.totalTipsEarned,
        totalTipsEarnedUSDC: balanceInUSDC,
        canWithdraw,
        minimumWithdrawal: 5000000, // 5 USDC in wei
        minimumWithdrawalUSDC: 5
      }
    });

  } catch (error) {
    console.error('Error fetching tip balance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}