import { connectDB } from '../_lib/database';
import User from '../../src/models/User';
import WithdrawalHistory from '../../src/models/WithdrawalHistory';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { walletAddress, amount } = req.body;

  if (!walletAddress || !amount) {
    return res.status(400).json({ error: 'Missing required fields: walletAddress, amount' });
  }

  try {
    await connectDB();

    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check minimum withdrawal (5 USDC)
    if (user.totalTipsEarned < 5000000) { // 5 USDC in wei
      return res.status(400).json({ 
        error: 'Minimum withdrawal amount is 5 USDC',
        currentBalance: user.totalTipsEarned,
        minimumRequired: 5000000
      });
    }

    // Check if requested amount is available
    if (amount > user.totalTipsEarned) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        requestedAmount: amount,
        availableBalance: user.totalTipsEarned
      });
    }

    // In a real implementation, you would:
    // 1. Send the USDC to the user's wallet via smart contract
    // 2. Wait for transaction confirmation
    // 3. Update the user's balance
    
    // For now, we'll simulate the withdrawal by resetting the balance
    const withdrawnAmount = user.totalTipsEarned;
    
    // Create withdrawal history record
    const withdrawalRecord = new WithdrawalHistory({
      userId: user._id,
      walletAddress: user.walletAddress,
      amount: withdrawnAmount,
      amountUSDC: withdrawnAmount / 1000000, // Convert from wei to USDC
      status: 'completed', // Simulating immediate completion
      processedAt: new Date()
    });
    
    await withdrawalRecord.save();
    
    // Reset user's tip balance
    user.totalTipsEarned = 0;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: {
        walletAddress: user.walletAddress,
        withdrawnAmount: withdrawnAmount,
        withdrawnAmountUSDC: withdrawnAmount / 1000000, // Convert from wei to USDC
        newBalance: user.totalTipsEarned,
        newBalanceUSDC: 0,
        // In a real implementation, you would include:
        // transactionHash: '0x...',
        // transactionUrl: 'https://basescan.org/tx/0x...'
      }
    });

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}