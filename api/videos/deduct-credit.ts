import { connectDB } from '../_lib/database.js';
import User from '../../src/models/User.js';
import Video from '../../src/models/Video.js';
import Transaction from '../../src/models/Transaction.js';
import { getPerViewChargeAmount, applyBasePay, formatUSDC } from '../../src/lib/utils.js';
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
    await connectDB();

    const { walletAddress, videoId } = req.body;

    if (!walletAddress || !videoId) {
      return res.status(400).json({ error: 'Wallet address and video ID are required' });
    }

    // Find user
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has already watched this video (to prevent double deduction)
    if (user.videosWatched && user.videosWatched.includes(videoId)) {
      return res.status(200).json({ 
        success: true, 
        message: 'Video already watched',
        remainingCredits: user.viewCredits 
      });
    }

    // Check if user has credits
    if (!user.viewCredits || user.viewCredits <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient view credits',
        remainingCredits: 0
      });
    }

    // Find video
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Deduct one credit
    user.viewCredits -= 1;
    
    // Add video to watched list
    if (!user.videosWatched) {
      user.videosWatched = [];
    }
    user.videosWatched.push(videoId);
    
    await user.save();

    // Determine per-view attribution amount (only for non-free videos)
    const isFree = !!video.isFree;
    let perViewAmount = 0;
    let transaction: any = null;

    if (!isFree) {
      perViewAmount = getPerViewChargeAmount();
      const { finalAmount, basePayAmount, basePayApplied } = applyBasePay(perViewAmount);

      // Record view transaction (paid by credits)
      transaction = new Transaction({
        user: user._id,
        video: videoId,
        type: 'view',
        amount: finalAmount,
        amountDisplay: formatUSDC(finalAmount),
        paymentMethod: 'credit',
        status: 'completed',
        metadata: {
          basePayAmount,
          basePayApplied,
          deductedCredits: 1,
        },
      });
      await transaction.save();

      // Update video earnings and creator earnings by per-view amount
      await Video.findByIdAndUpdate(videoId, {
        $inc: { totalTipsEarned: finalAmount }
      });
      await User.findByIdAndUpdate(video.creator, {
        $inc: { totalTipsEarned: finalAmount }
      });
    } else {
      // For free videos, still deduct credits but record zero-amount transaction
      transaction = new Transaction({
        user: user._id,
        video: videoId,
        type: 'view',
        amount: 0,
        amountDisplay: 'FREE',
        paymentMethod: 'credit',
        status: 'completed',
        metadata: { deductedCredits: 1, basePayApplied: false, basePayAmount: 0 },
      });
      await transaction.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Credit deducted successfully',
      remainingCredits: user.viewCredits,
      transaction: transaction?._id
    });

  } catch (error) {
    console.error('Error deducting credit:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}