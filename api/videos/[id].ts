import type { IncomingMessage, ServerResponse } from 'http';
import { connectDB } from '../_lib/database.js';
import Video from '../../src/models/Video.js';
import User from '../../src/models/User.js';

function send(res: ServerResponse, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default async function handler(req: IncomingMessage & { method?: string; url?: string }, res: ServerResponse) {
  try {
    await connectDB();
  } catch (err) {
    return send(res, 500, { success: false, error: 'Database connection failed' });
  }

  const method = (req.method || 'GET').toUpperCase();

  if (method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  const url = new URL(req.url || '', 'http://localhost');
  const pathParts = url.pathname.split('/');
  const videoId = pathParts[pathParts.length - 1];
  const userId = url.searchParams.get('userId') || undefined;

  try {
    const video = await (Video as any).findById(videoId)
      .populate('creator', 'username displayName avatar')
      .lean();

    if (!video) {
      return send(res, 404, { success: false, error: 'Video not found' });
    }

    let isUnlocked = false;
    if (userId) {
      const user = await (User as any).findById(userId).lean();
      isUnlocked = user?.videosUnlocked?.includes(videoId) || false;
    }

    return send(res, 200, { success: true, data: { ...video, isUnlocked } });
  } catch (error) {
    console.error('Error fetching video:', error);
    return send(res, 500, { success: false, error: 'Failed to fetch video' });
  }
}