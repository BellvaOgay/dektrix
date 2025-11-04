import { connectDB } from './_lib/database';
import User from '../src/models/User';
import Video from '../src/models/Video';
import Transaction from '../src/models/Transaction';
import { applyBasePay } from '../src/lib/utils';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fromUserId, videoId, transactionData } = req.body;

    if (!fromUserId || !videoId || !transactionData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    await connectDB();

    // Fixed tip amount - always 0.1 USDC
    const FIXED_TIP_AMOUNT = 100000; // 0.1 USDC in wei (6 decimals)
    const FIXED_TIP_DISPLAY = "0.1 USDC";

    // Get video and find creator
    const video = await Video.findById(videoId).populate('creator');
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Get users
    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId),
      User.findOne({ wallet_address: video.creatorWallet }) || 
      User.findById(video.creator)
    ]);

    if (!fromUser || !toUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Apply BasePay if using basepay payment method
    let finalAmount = FIXED_TIP_AMOUNT;
    let basePayAmount = 0;
    let basePayApplied = false;

    if (transactionData.paymentMethod === 'basepay') {
      const basePayResult = applyBasePay(FIXED_TIP_AMOUNT);
      finalAmount = basePayResult.finalAmount;
      basePayAmount = basePayResult.basePayAmount;
      basePayApplied = basePayResult.basePayApplied;
    }

    // Create transaction
    const transaction = new Transaction({
      user: fromUserId,
      video: videoId,
      type: 'tip',
      amount: finalAmount,
      amountDisplay: FIXED_TIP_DISPLAY,
      paymentMethod: transactionData.paymentMethod || 'crypto',
      transactionHash: transactionData.transactionHash,
      status: 'completed',
      metadata: {
        basePayAmount,
        basePayApplied,
        ...transactionData.metadata
      }
    });

    await transaction.save();

    // Update user balances and track tipped videos
    fromUser.totalTipsSpent += finalAmount;
    
    // Add video to user's tipped videos if not already present
    if (!fromUser.videosTipped.includes(videoId)) {
      fromUser.videosTipped.push(videoId);
    }
    
    toUser.totalTipsEarned += finalAmount;

    await Promise.all([
      fromUser.save(),
      toUser.save()
    ]);

    // Update video stats
    video.totalTipsEarned += finalAmount;
    await video.save();

    return res.status(200).json({
      success: true,
      data: {
        transaction,
        fromUser,
        toUser,
        video,
        tipAmount: finalAmount,
        tipAmountDisplay: FIXED_TIP_DISPLAY
      }
    });
  } catch (error) {
    console.error('Error processing tip:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process tip'
    });
  }
}