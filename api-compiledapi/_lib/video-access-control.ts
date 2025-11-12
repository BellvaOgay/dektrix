import { IncomingMessage, ServerResponse } from 'http';
import { connectDB } from './database';
import User from '../../src/models/User';
import Video from '../../src/models/Video';

export interface VideoAccessRequest {
  userId?: string;
  walletAddress?: string;
  videoId?: string;
  videoPath?: string;
}

export interface VideoAccessResponse {
  allowed: boolean;
  reason: string;
  requiresAuth: boolean;
  creditsRequired: number;
  userCredits?: number;
}

/**
 * Check if user has access to a specific video
 * Requires either wallet connection (credits > 0) OR video unlock
 */
export async function checkVideoAccess(
  req: VideoAccessRequest
): Promise<VideoAccessResponse> {
  try {
    // Skip database connection during build process
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development-build') {
      return {
        allowed: false,
        reason: 'Build process - access control disabled',
        requiresAuth: true,
        creditsRequired: 1
      };
    }

    try {
      await connectDB();
    } catch (dbError) {
      console.warn('Database connection failed, using fallback access control:', dbError);
      // In development, allow access with basic restrictions
      if (process.env.NODE_ENV === 'development') {
        return {
          allowed: !req.videoPath, // Block specific videos, allow general access
          reason: req.videoPath ? 'Video access requires wallet connection' : 'Basic access granted',
          requiresAuth: !!req.videoPath,
          creditsRequired: 1
        };
      }
      throw dbError;
    }

    // Extract video ID from path if not provided
    let videoId = req.videoId;
    let videoPath = req.videoPath;
    
    if (!videoId && videoPath) {
      // Extract video ID from path like "/videos/Ep1.mp4"
      const match = videoPath.match(/\/videos\/(Ep\d+|Eps\d+|Vid\d+)\.mp4/);
      if (match) {
        const videoIdentifier = match[1];
        // Find video by title or filename
        const video = await Video.findOne({
          $or: [
            { title: { $regex: videoIdentifier, $options: 'i' } },
            { videoUrl: { $regex: videoIdentifier, $options: 'i' } }
          ]
        });
        videoId = video?._id?.toString();
      }
    }

    // If no wallet or user ID provided, require authentication
    if (!req.walletAddress && !req.userId) {
      return {
        allowed: false,
        reason: 'Wallet connection required',
        requiresAuth: true,
        creditsRequired: 1
      };
    }

    // Find user by wallet address or user ID
    let user;
    if (req.userId) {
      user = await User.findById(req.userId);
    } else if (req.walletAddress) {
      user = await User.findOne({ wallet_address: req.walletAddress.toLowerCase() });
    }

    if (!user) {
      return {
        allowed: false,
        reason: 'User not found - wallet must be connected',
        requiresAuth: true,
        creditsRequired: 1
      };
    }

    // Check if user has sufficient credits
    const userCredits = user.viewCredits || 0;
    const creditsRequired = 1; // Minimum 1 credit required to watch any video

    if (userCredits <= 0) {
      return {
        allowed: false,
        reason: 'Insufficient credits - purchase credits to continue',
        requiresAuth: false,
        creditsRequired,
        userCredits
      };
    }

    // If we have a specific video, check if it's unlocked or free
    if (videoId) {
      const video = await Video.findById(videoId);
      
      if (!video) {
        return {
          allowed: false,
          reason: 'Video not found',
          requiresAuth: false,
          creditsRequired
        };
      }

      // Free videos can be watched with credits > 0
      if (video.isFree) {
        return {
          allowed: true,
          reason: 'Free video - credits available',
          requiresAuth: false,
          creditsRequired: 0,
          userCredits
        };
      }

      // Check if video is unlocked by user
      const isUnlocked = videoId ? user.videosUnlocked.some(id => id.toString() === videoId) : false;
      if (isUnlocked) {
        return {
          allowed: true,
          reason: 'Video unlocked',
          requiresAuth: false,
          creditsRequired: 0,
          userCredits
        };
      }

      // Video is locked and requires purchase
      return {
        allowed: false,
        reason: 'Video locked - purchase required',
        requiresAuth: false,
        creditsRequired: video.price || 100000, // Return price in wei
        userCredits
      };
    }

    // General video access (credits > 0 allows basic access)
    return {
      allowed: true,
      reason: 'Basic access - credits available',
      requiresAuth: false,
      creditsRequired: 0,
      userCredits
    };

  } catch (error) {
    console.error('Video access check error:', error);
    return {
      allowed: false,
      reason: 'System error - please try again',
      requiresAuth: true,
      creditsRequired: 1
    };
  }
}

/**
 * Middleware to protect video streaming endpoints
 */
export async function videoAccessMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): Promise<void> {
  try {
    // Extract wallet address from headers or query params
    const walletAddress = req.headers['x-wallet-address'] as string || 
                         new URL(req.url || '', 'http://localhost').searchParams.get('wallet');
    
    const userId = req.headers['x-user-id'] as string ||
                   new URL(req.url || '', 'http://localhost').searchParams.get('userId');

    const videoPath = req.url;

    const accessResult = await checkVideoAccess({
      userId: userId || undefined,
      walletAddress: walletAddress || undefined,
      videoPath
    });

    if (!accessResult.allowed) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: accessResult.reason,
        requiresAuth: accessResult.requiresAuth,
        creditsRequired: accessResult.creditsRequired,
        userCredits: accessResult.userCredits
      }));
      return;
    }

    // Add access info to request for downstream use
    (req as any).videoAccess = accessResult;
    next();

  } catch (error) {
    console.error('Video access middleware error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }));
  }
}