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
    await connectDB();

    // Find Ep6 video by title (case insensitive search for Ep6)
    const ep6Video = await (Video as any)
      .findOne({
        $or: [
          { title: { $regex: /Ep6/i } },
          { filename: { $regex: /Ep6\.mp4$/i } }
        ],
        isActive: true
      })
      .populate('creator', 'username displayName avatar')
      .lean();

    if (!ep6Video) {
      return res.status(404).json({
        success: false,
        error: 'Ep6 video not found'
      });
    }

    // Format the response with all necessary video details
    const response = {
      success: true,
      data: {
        _id: ep6Video._id,
        title: ep6Video.title,
        description: ep6Video.description || 'Ep6 - The Next Chapter',
        videoUrl: ep6Video.videoUrl,
        thumbnail: ep6Video.thumbnail || '/placeholder.svg',
        duration: ep6Video.duration || 0,
        category: ep6Video.category || 'Blockchain',
        price: ep6Video.price || 100000, // Default to 0.1 USDC if not set
        priceDisplay: ep6Video.priceDisplay || '0.1 USDC',
        isFree: ep6Video.isFree || false,
        isUnlocked: ep6Video.isUnlocked || false,
        totalViews: ep6Video.totalViews || 0,
        totalUnlocks: ep6Video.totalUnlocks || 0,
        createdAt: ep6Video.createdAt,
        creator: ep6Video.creator ? {
          _id: ep6Video.creator._id,
          username: ep6Video.creator.username,
          displayName: ep6Video.creator.displayName,
          avatar: ep6Video.creator.avatar
        } : null,
        // Additional metadata
        shouldBeLocked: !ep6Video.isFree && (ep6Video.price > 0),
        isEp6: true
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching Ep6 video:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch Ep6 video'
    });
  }
}