import { connectDB } from '../_lib/database';
import WithdrawalHistory from '../../src/models/WithdrawalHistory';
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

    // Get withdrawal history for the user
    const withdrawals = await WithdrawalHistory.find({ 
      walletAddress: walletAddress.toLowerCase() 
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

    return res.status(200).json({
      success: true,
      data: {
        walletAddress: walletAddress.toLowerCase(),
        withdrawals: withdrawals.map((withdrawal: any) => ({
          id: withdrawal._id,
          amount: withdrawal.amount,
          amountUSDC: withdrawal.amountUSDC,
          status: withdrawal.status,
          transactionHash: withdrawal.transactionHash,
          processedAt: withdrawal.processedAt,
          createdAt: withdrawal.createdAt,
          errorMessage: withdrawal.errorMessage
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching withdrawal history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}