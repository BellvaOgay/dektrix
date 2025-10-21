import connectDB from '../lib/database';
import User from '../models/User';
import Video from '../models/Video';

// Check if user has unlocked a specific video
export async function checkVideoUnlockStatus(userId: string, videoId: string) {
  try {
    await connectDB();

    // Check if user exists
    const user = await (User as any).findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Check if video exists
    const video = await (Video as any).findById(videoId);
    if (!video) {
      return {
        success: false,
        error: 'Video not found'
      };
    }

    // Check if video is free
    if (video.isFree) {
      return {
        success: true,
        data: {
          isUnlocked: true,
          reason: 'free_video',
          requiresPayment: false
        }
      };
    }

    // Check if user has unlocked this video
    const isUnlocked = user.videosUnlocked.includes(videoId);

    return {
      success: true,
      data: {
        isUnlocked,
        reason: isUnlocked ? 'purchased' : 'locked',
        requiresPayment: !isUnlocked,
        price: video.price || 100000, // Default to 0.1 USDC in wei
        priceDisplay: video.priceDisplay || '0.1 USDC'
      }
    };

  } catch (error: any) {
    console.error('Error checking video unlock status:', error);
    return {
      success: false,
      error: 'Failed to check unlock status: ' + error.message
    };
  }
}

// Get all unlocked videos for a user with detailed info
export async function getUserUnlockedVideosDetailed(userId: string) {
  try {
    await connectDB();

    const user = await (User as any).findById(userId)
      .populate({
        path: 'videosUnlocked',
        populate: {
          path: 'creator',
          select: 'username displayName avatar wallet_address'
        }
      })
      .lean();

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Add unlock status to each video
    const unlockedVideos = user.videosUnlocked.map((video: any) => ({
      ...video,
      isUnlocked: true,
      unlockReason: 'purchased'
    }));

    return {
      success: true,
      data: {
        unlockedVideos,
        totalUnlocked: unlockedVideos.length,
        userId: user._id
      }
    };

  } catch (error: any) {
    console.error('Error fetching user unlocked videos:', error);
    return {
      success: false,
      error: 'Failed to fetch unlocked videos: ' + error.message
    };
  }
}

// Get user's video access summary
export async function getUserVideoAccessSummary(userId: string) {
  try {
    await connectDB();

    const user = await (User as any).findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Get total videos count
    const totalVideos = await (Video as any).countDocuments({ isActive: true });
    
    // Get free videos count
    const freeVideos = await (Video as any).countDocuments({ 
      isActive: true, 
      isFree: true 
    });

    // Get paid videos count
    const paidVideos = totalVideos - freeVideos;

    // Get user's unlocked paid videos count
    const unlockedPaidVideos = user.videosUnlocked.length;

    return {
      success: true,
      data: {
        userId: user._id,
        totalVideos,
        freeVideos,
        paidVideos,
        unlockedPaidVideos,
        lockedPaidVideos: paidVideos - unlockedPaidVideos,
        accessPercentage: paidVideos > 0 ? Math.round((unlockedPaidVideos / paidVideos) * 100) : 100
      }
    };

  } catch (error: any) {
    console.error('Error getting user video access summary:', error);
    return {
      success: false,
      error: 'Failed to get access summary: ' + error.message
    };
  }
}