import type { IncomingMessage, ServerResponse } from 'http';
import { connectDB } from './_lib/database.js';
import Video from '../src/models/Video.js';
import User from '../src/models/User.js';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

function send(res: ServerResponse, status: number, data: ApiResponse) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default async function handler(req: IncomingMessage & { method?: string; url?: string; query?: any; body?: any }, res: ServerResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error:', err);
    return send(res, 500, { success: false, error: 'Database connection failed' });
  }

  const method = (req.method || 'GET').toUpperCase();

  if (method === 'GET') {
    // Parse query params
    const url = new URL(req.url || '', 'http://localhost');
    const category = url.searchParams.get('category') || undefined;
    const featuredParam = url.searchParams.get('featured');
    const featured = featuredParam === undefined ? undefined : featuredParam === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const skip = parseInt(url.searchParams.get('skip') || '0', 10);

    const query: any = { isActive: true };
    if (category) query.category = category;
    if (featured !== undefined) query.featured = featured;

    try {
      const videos = await (Video as any)
        .find(query)
        .populate('creator', 'username displayName avatar')
        .sort({ featured: -1, createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      return send(res, 200, { success: true, data: videos });
    } catch (error) {
      console.error('Error fetching videos:', error);
      return send(res, 500, { success: false, error: 'Failed to fetch videos' });
    }
  }

  if (method === 'POST') {
    // Collect body
    let bodyData = '';
    req.on('data', (chunk) => { bodyData += chunk; });
    req.on('end', async () => {
      try {
        const data = bodyData ? JSON.parse(bodyData) : {};
        // Basic validation
        if (!data.title || !data.description || !data.videoUrl || !data.thumbnail || !data.duration || !data.category || data.price === undefined || !data.priceDisplay || !data.creatorWallet) {
          return send(res, 400, { success: false, error: 'Missing required fields' });
        }

        // Ensure creator exists (create if absent)
        let creator = await (User as any).findOne({ walletAddress: data.creatorWallet });
        if (!creator) {
          creator = new (User as any)({
            username: data.creatorWallet.slice(0, 8),
            walletAddress: data.creatorWallet,
          });
          await creator.save();
        }

        const video = new (Video as any)({
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
          videoUrl: data.videoUrl,
          duration: data.duration,
          category: data.category,
          tags: data.tags || [],
          price: data.price,
          priceDisplay: data.priceDisplay,
          difficulty: data.difficulty || 'Beginner',
          creator: creator._id,
          totalViews: 0,
          totalUnlocks: 0,
          totalTipsEarned: 0,
          isActive: true,
          featured: !!data.featured,
          isFree: !!data.isFree,
        });

        await video.save();
        return send(res, 201, { success: true, data: video });
      } catch (error) {
        console.error('Error creating video:', error);
        return send(res, 500, { success: false, error: 'Failed to create video' });
      }
    });
    return;
  }

  // Method not allowed
  res.setHeader('Allow', 'GET,POST');
  return send(res, 405, { success: false, error: 'Method Not Allowed' });
}