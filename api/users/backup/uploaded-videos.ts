import { connectDB } from '../_lib/database';
import User from '../../src/models/User';
import Video from '../../src/models/Video';
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

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's uploaded videos
    const uploadedVideos = await Video.find({ 
      creator: user._id 
    })
    .select('title description thumbnail videoUrl duration category totalViews totalTipsEarned createdAt')
    .sort({ createdAt: -1 })
    .lean();

    return res.status(200).json({
      success: true,
      data: {
        user: {
          walletAddress: user.walletAddress,
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          totalTipsEarned: user.totalTipsEarned,
          viewCredits: user.viewCredits
        },
        uploadedVideos: uploadedVideos.map((video: any) => ({
          id: video._id,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          videoUrl: video.videoUrl,
          duration: video.duration,
          category: video.category,
          totalViews: video.totalViews,
          totalTipsEarned: video.totalTipsEarned,
          createdAt: video.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching user videos:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}