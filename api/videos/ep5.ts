import type { IncomingMessage, ServerResponse } from 'http';
import connectDB from '../../src/lib/database';
import Video from '../../src/models/Video.js';

export default async function handler(req: IncomingMessage & { method?: string }, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    // Connect to database
    await connectDB();

    // Find Esp5 video by title (case insensitive search for Ep5)
    const esp5Video = await (Video as any)
      .findOne({
        $or: [
          { title: { $regex: /Ep5/i } },
          { videoUrl: { $regex: /Ep5\.mp4$/i } }
        ]
      })
      .populate('creator', 'username displayName avatar')
      .lean();

    if (!esp5Video) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Esp5 video not found' }));
      return;
    }

    // Return the video data
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: {
        _id: esp5Video._id,
        title: esp5Video.title,
        description: esp5Video.description || 'Ep5 - Premium content',
        videoUrl: esp5Video.videoUrl,
        thumbnail: esp5Video.thumbnail || '/placeholder.svg',
        duration: esp5Video.duration || 0,
        category: esp5Video.category || 'Entertainment',
        price: esp5Video.price || 100000, // Default to 0.1 USDC if not set
        priceDisplay: esp5Video.priceDisplay || '0.1 USDC',
        isFree: esp5Video.isFree || false,
        isUnlocked: esp5Video.isUnlocked || false,
        totalViews: esp5Video.totalViews || 0,
        totalUnlocks: esp5Video.totalUnlocks || 0,
        createdAt: esp5Video.createdAt,
        creator: esp5Video.creator ? {
          _id: esp5Video.creator._id,
          username: esp5Video.creator.username,
          displayName: esp5Video.creator.displayName,
          avatar: esp5Video.creator.avatar
        } : null,
        shouldBeLocked: !esp5Video.isFree && (esp5Video.price > 0),
        isEp5: true
      }
    }));

  } catch (error) {
    console.error('Error fetching Esp5 video:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: 'Failed to fetch Esp5 video'
    }));
  }
}