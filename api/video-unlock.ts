import mongoose from 'mongoose';
import connectDB from '../src/lib/database';
import User from '../src/models/User.js';
import Video from '../src/models/Video.js';
import Transaction from '../src/models/Transaction.js';
import { applyBasePay } from '../src/lib/utils';

interface UnlockRequest {
  userId: string;
  videoId: string;
  transactionHash: string;
  paymentMethod: 'crypto' | 'basepay';
  amount: number;
  amountDisplay: string;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { userId, videoId, transactionHash, paymentMethod, amount, amountDisplay }: UnlockRequest = req.body;

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
    if (user.videosUnlocked.includes(new mongoose.Types.ObjectId(videoId))) {
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
      const basePayResult = applyBasePay(amount);
      finalAmount = basePayResult.finalAmount;
      basePayAmount = basePayResult.basePayAmount;
      basePayApplied = basePayResult.basePayApplied;
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
    user.videosUnlocked.push(new mongoose.Types.ObjectId(videoId));
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

  } catch (error: any) {
    console.error('Error processing video unlock:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}