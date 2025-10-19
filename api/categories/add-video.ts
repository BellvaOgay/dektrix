import type { IncomingMessage, ServerResponse } from 'http';
import { connectDB } from '../_lib/database.js';
import Video from '../../src/models/Video.js';
import Category from '../../src/models/Category.js';

function send(res: ServerResponse, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(data));
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

export default async function handler(
  req: IncomingMessage & { method?: string; url?: string; query?: any; body?: any }, 
  res: ServerResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return send(res, 200, {});
  }

  try {
    await connectDB();
  } catch (err) {
    return send(res, 500, { success: false, error: 'Database connection failed' });
  }

  const method = (req.method || 'POST').toUpperCase();

  if (method === 'POST') {
    try {
      const body = await parseBody(req);
      const { videoId, categorySlug } = body;

      // Validate required fields
      if (!videoId || !categorySlug) {
        return send(res, 400, { 
          success: false, 
          error: 'videoId and categorySlug are required' 
        });
      }

      // Check if video exists
      const video = await (Video as any).findById(videoId);
      if (!video) {
        return send(res, 404, { 
          success: false, 
          error: 'Video not found' 
        });
      }

      // Check if category exists
      const category = await (Category as any).findOne({ slug: categorySlug, isActive: true });
      if (!category) {
        return send(res, 404, { 
          success: false, 
          error: 'Category not found or inactive' 
        });
      }

      // Get the old category for count updates
      const oldCategorySlug = video.category;

      // Update video's category
      const updatedVideo = await (Video as any).findByIdAndUpdate(
        videoId,
        { category: categorySlug },
        { new: true, runValidators: true }
      ).populate('creator', 'username displayName avatar');

      // Update video counts for both old and new categories
      if (oldCategorySlug && oldCategorySlug !== categorySlug) {
        // Decrease count for old category
        const oldVideoCount = await (Video as any).countDocuments({
          category: oldCategorySlug,
          isActive: true
        });
        await (Category as any).findOneAndUpdate(
          { slug: oldCategorySlug },
          { videoCount: oldVideoCount }
        );
      }

      // Update count for new category
      const newVideoCount = await (Video as any).countDocuments({
        category: categorySlug,
        isActive: true
      });
      await (Category as any).findOneAndUpdate(
        { slug: categorySlug },
        { videoCount: newVideoCount }
      );

      return send(res, 200, {
        success: true,
        message: 'Video successfully added to category',
        data: {
          video: updatedVideo,
          oldCategory: oldCategorySlug,
          newCategory: categorySlug
        }
      });

    } catch (error) {
      console.error('Error adding video to category:', error);
      return send(res, 500, { 
        success: false, 
        error: 'Failed to add video to category' 
      });
    }
  }

  // Method not allowed
  return send(res, 405, { 
    success: false, 
    error: 'Method not allowed. Use POST.' 
  });
}