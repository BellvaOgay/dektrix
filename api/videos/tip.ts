import { connectDB } from '../_lib/database';
import User from '../../src/models/User';
import Video from '../../src/models/Video';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoId, tipperWallet, amount } = req.body;

  if (!videoId || !tipperWallet || !amount) {
    return res.status(400).json({ error: 'Missing required fields: videoId, tipperWallet, amount' });
  }

  try {
    await connectDB();

    // Find the video and its creator
    const video = await Video.findById(videoId).populate('creator');
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Find the tipper user
    const tipperUser = await User.findOne({ walletAddress: tipperWallet.toLowerCase() });
    if (!tipperUser) {
      return res.status(404).json({ error: 'Tipper user not found' });
    }

    // Check if tipper has enough credits (assuming 1 credit = 1 USDC for simplicity)
    const tipAmountInCredits = amount / 1000000; // Convert from wei to USDC (6 decimals)
    if (tipperUser.viewCredits < tipAmountInCredits) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Deduct credits from tipper
    tipperUser.viewCredits -= tipAmountInCredits;
    tipperUser.totalTipsSpent += amount;
    tipperUser.videosTipped.push(videoId);
    await tipperUser.save();

    // Add tip to creator
    const creator = await User.findById(video.creator);
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    creator.totalTipsEarned += amount;
    video.totalTipsEarned += amount;
    
    await creator.save();
    await video.save();

    return res.status(200).json({
      success: true,
      message: 'Tip sent successfully',
      data: {
        videoId,
        creatorWallet: creator.walletAddress,
        tipperWallet,
        amount,
        creatorNewBalance: creator.totalTipsEarned,
        tipperNewCredits: tipperUser.viewCredits
      }
    });

  } catch (error) {
    console.error('Error processing tip:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}