import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectDB from '../../src/lib/database';
import Video from '../../src/models/Video.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    // Connect to database
    await connectDB();

    // Find Ep5 video by title or filename (case insensitive search)
    const ep5Video = await (Video as any)
      .findOne({
        $or: [
          { title: { $regex: /Ep5/i } },
          { filename: { $regex: /Ep5\.mp4$/i } },
          { videoUrl: { $regex: /Ep5\.mp4$/i } }
        ],
        isActive: true
      })
      .populate('creator', 'username displayName avatar')
      .lean();

    if (!ep5Video) {
      return res.status(404).json({ success: false, error: 'Ep5 video not found' });
    }

    // Return the video data
    return res.status(200).json({
      success: true,
      data: {
        _id: ep5Video._id,
        title: ep5Video.title,
        description: ep5Video.description || 'Ep5 - Premium content',
        videoUrl: ep5Video.videoUrl,
        filename: ep5Video.filename || 'Ep5.mp4',
        thumbnail: ep5Video.thumbnail || '/placeholder.svg',
        duration: ep5Video.duration || 0,
        category: ep5Video.category || 'Entertainment',
        price: ep5Video.price || 100000, // Default to 0.1 USDC if not set
        priceDisplay: ep5Video.priceDisplay || '0.1 USDC',
        isFree: ep5Video.isFree || false,
        isUnlocked: ep5Video.isUnlocked || false,
        totalViews: ep5Video.totalViews || 0,
        totalUnlocks: ep5Video.totalUnlocks || 0,
        createdAt: ep5Video.createdAt,
        creator: ep5Video.creator ? {
          _id: ep5Video.creator._id,
          username: ep5Video.creator.username,
          displayName: ep5Video.creator.displayName,
          avatar: ep5Video.creator.avatar
        } : null,
        shouldBeLocked: !ep5Video.isFree && (ep5Video.price > 0),
        isEp5: true
      }
    });

  } catch (error) {
    console.error('Error fetching Ep5 video:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch Ep5 video'
    });
  }
}