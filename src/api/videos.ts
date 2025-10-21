import { logger } from '@/lib/logger';
import connectDB from '../lib/database';
import Video from '../models/Video';
import User from '../models/User';
import Transaction from '../models/Transaction';
import type { IVideo } from '../models/Video';
import type { IUser } from '../models/User';
import { applyBasePay, getPerViewChargeAmount, formatUSDC, calculateBasePayPrice, isBasePayEnabled } from '../lib/utils';

// Mock storage for browser environment
let mockVideos: any[] = [
  {
    _id: '68f3cd912c1d63bfd2d8711b',
    title: 'Introduction to AI Agents',
    category: 'AI Agents',
    duration: 28,
    price: 100000,
    priceDisplay: '0.1 USDC',
    thumbnail: '/placeholder.svg',
    isFree: true,
    isUnlocked: true,
    videoUrl: '/videos/Vid1.mp4',
    description: 'Overview of emerging agent-to-agent marketplaces and hiring patterns.'
  },
  {
    _id: '68f3cd912c1d63bfd2d8711e',
    title: 'DeFi Fundamentals',
    category: 'DeFi',
    duration: 35,
    price: 100000,
    priceDisplay: '0.1 USDC',
    thumbnail: '/placeholder.svg',
    isFree: true,
    isUnlocked: true,
    videoUrl: '/videos/Vid2.mp4',
    description: 'Beginner-friendly DeFi walkthrough with simple analogies and examples.'
  },
  {
    _id: '68f3cd922c1d63bfd2d87121',
    title: 'Blockchain Basics',
    category: 'Blockchain',
    duration: 200,
    price: 100000,
    priceDisplay: '0.1 USDC',
    thumbnail: '/placeholder.svg',
    isFree: true,
    isUnlocked: true,
    videoUrl: '/videos/Vid3.mp4',
    description: 'Learn the fundamental concepts of blockchain technology.'
  },
  {
    _id: '68f3e66330567f8b7a2a70de',
    title: 'Web3 Security Fundamentals',
    category: 'Web3 Security',
    duration: 240,
    price: 100000,
    priceDisplay: '0.1 USDC',
    thumbnail: '/placeholder.svg',
    isFree: true,
    isUnlocked: true,
    videoUrl: '/videos/Vid4.mp4',
    description: 'Essential security practices for Web3 development and smart contracts.'
  }
];

// Get all videos with optional filtering
export async function getVideos(filters?: {
  category?: string;
  featured?: boolean;
  limit?: number;
  skip?: number;
}) {
  try {
    // Use serverless API when running in the browser
    if (typeof window !== 'undefined') {
      // In dev, avoid hitting /api (Vite doesn’t run serverless) and use mock
      if (import.meta.env.DEV) {
        return { success: true, data: mockVideos.slice(0, filters?.limit || 20) };
      }

      const params = new URLSearchParams();
      if (filters?.category) params.set('category', filters.category);
      if (filters?.featured !== undefined) params.set('featured', String(filters.featured));
      if (filters?.limit !== undefined) params.set('limit', String(filters.limit));
      if (filters?.skip !== undefined) params.set('skip', String(filters.skip));

      try {
        const res = await fetch(`/api/videos?${params.toString()}`);
        if (!res.ok) {
          console.error('API fetch failed:', res.status, res.statusText);
          // Fallback to mock data if API fails in production
          return { success: true, data: mockVideos.slice(0, filters?.limit || 20) };
        }
        const json = await res.json();
        return json;
      } catch (e) {
        console.error('Fetch /api/videos failed:', e);
        // Fallback to mock data if API fails
        return { success: true, data: mockVideos.slice(0, filters?.limit || 20) };
      }
    }

    // Fallback to direct DB access on server
    await connectDB();
    const query: any = { isActive: true };
    if (filters?.category) query.category = filters.category;
    if (filters?.featured !== undefined) query.featured = filters.featured;

    const videos = await (Video as any).find(query)
      .populate('creator', 'username displayName avatar')
      .sort({ featured: -1, createdAt: -1 })
      .limit(filters?.limit || 20)
      .skip(filters?.skip || 0)
      .lean();

    return { success: true, data: videos };
  } catch (error) {
    console.error('Error fetching videos:', error);
    return { success: false, error: 'Failed to fetch videos' };
  }
}

// Get a single video by ID
export async function getVideoById(videoId: string, userId?: string) {
  try {
    // Use serverless API in browser
    if (typeof window !== 'undefined') {
      if (import.meta.env.DEV) {
        const v = mockVideos.find(v => v._id === videoId) || mockVideos[0];
        return { success: true, data: { ...v, isUnlocked: v.isUnlocked || v.isFree } };
      }

      const url = userId
        ? `/api/videos/${videoId}?userId=${encodeURIComponent(userId)}`
        : `/api/videos/${videoId}`;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          return { success: false, error: `HTTP ${res.status}` };
        }
        const json = await res.json();
        return json;
      } catch (e) {
        console.error('Fetch /api/videos/[id] failed:', e);
        return { success: false, error: 'Failed to fetch video' };
      }
    }

    // Fallback to direct DB access on server
    await connectDB();
    const video = await (Video as any).findById(videoId)
      .populate('creator', 'username displayName avatar')
      .lean();

    if (!video) {
      return { success: false, error: 'Video not found' };
    }

    let isUnlocked = false;
    if (userId) {
      const user = await (User as any).findById(userId).lean();
      isUnlocked = user?.videosUnlocked?.includes(videoId) || false;
    }

    return { success: true, data: { ...video, isUnlocked } };
  } catch (error) {
    console.error('Error fetching video:', error);
    return { success: false, error: 'Failed to fetch video' };
  }
}

// Create a new video
export async function createVideo(videoData: Partial<IVideo>) {
  try {
    await connectDB();

    // In browser environment, use mock storage
    if (typeof window !== 'undefined') {
      logger.debug('🌐 Creating video in mock storage');
      const newVideo = {
        _id: Date.now().toString(),
        ...videoData,
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        isActive: true
      };
      mockVideos.push(newVideo);

      return {
        success: true,
        data: newVideo
      };
    }

    const video = new Video(videoData);
    await video.save();

    return {
      success: true,
      data: video
    };
  } catch (error) {
    console.error('Error creating video:', error);
    return {
      success: false,
      error: 'Failed to create video'
    };
  }
}

// Unlock a video for a user with BasePay integration
export async function unlockVideoWithBasePay(userId: string, videoId: string, transactionData: {
  amount: number;
  amountDisplay: string;
  paymentMethod: 'crypto' | 'farcaster' | 'basepay';
  transactionHash?: string;
  metadata?: any;
}) {
  try {
    // Dev-mode browser fallback: simulate unlock without DB
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      return {
        success: true,
        data: {
          transaction: { type: 'unlock', amount: transactionData.amount, amountDisplay: transactionData.amountDisplay },
          video: { _id: videoId },
          user: { _id: userId },
        }
      };
    }

    await connectDB();

    // Check if video exists
    const video = await (Video as any).findById(videoId);
    if (!video) {
      return {
        success: false,
        error: 'Video not found'
      };
    }

    // Check if user exists
    const user = await (User as any).findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Check if already unlocked
    if (user.videosUnlocked.includes(videoId)) {
      return {
        success: false,
        error: 'Video already unlocked'
      };
    }

    let finalAmount = transactionData.amount;
    let basePayAmount = 0;
    let basePayApplied = false;

    // Apply BasePay if using basepay payment method
    if (transactionData.paymentMethod === 'basepay') {
      const basePayResult = applyBasePay(transactionData.amount);
      finalAmount = basePayResult.finalAmount;
      basePayAmount = basePayResult.basePayAmount;
      basePayApplied = basePayResult.basePayApplied;
    }

    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      video: videoId,
      type: 'unlock',
      ...transactionData,
      amount: finalAmount,
      status: 'completed',
      metadata: {
        ...(transactionData.metadata || {}),
        basePayAmount,
        basePayApplied,
        paymentMethod: transactionData.paymentMethod,
      },
    });

    await transaction.save();

    // Update user's unlocked videos
    user.videosUnlocked.push(videoId);
    user.totalTipsSpent += finalAmount;
    await user.save();

    // Update video stats
    video.totalUnlocks += 1;
    video.totalTipsEarned += finalAmount;
    await video.save();

    // Update creator's earnings
    await (User as any).findByIdAndUpdate(video.creator, {
      $inc: { totalTipsEarned: finalAmount }
    });

    return {
      success: true,
      data: {
        transaction,
        video,
        user,
        basePayApplied,
        basePayAmount
      }
    };
  } catch (error) {
    console.error('Error unlocking video with BasePay:', error);
    return {
      success: false,
      error: 'Failed to unlock video'
    };
  }
}

// Unlock a video for a user
export async function unlockVideo(userId: string, videoId: string, transactionData: {
  amount: number;
  amountDisplay: string;
  paymentMethod: 'crypto' | 'farcaster' | 'credit' | 'basepay';
  transactionHash?: string;
  metadata?: any;
}) {
  try {
    // Dev-mode browser fallback: simulate unlock without DB
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      return {
        success: true,
        data: {
          transaction: { type: 'unlock', amount: transactionData.amount, amountDisplay: transactionData.amountDisplay },
          video: { _id: videoId },
          user: { _id: userId },
        }
      };
    }

    await connectDB();

    // Check if video exists
    const video = await (Video as any).findById(videoId);
    if (!video) {
      return {
        success: false,
        error: 'Video not found'
      };
    }

    // Check if user exists
    const user = await (User as any).findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Check if already unlocked
    if (user.videosUnlocked.includes(videoId)) {
      return {
        success: false,
        error: 'Video already unlocked'
      };
    }

    const { finalAmount, basePayAmount, basePayApplied } = applyBasePay(transactionData.amount);

    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      video: videoId,
      type: 'unlock',
      ...transactionData,
      amount: finalAmount,
      status: 'completed',
      metadata: {
        ...(transactionData.metadata || {}),
        basePayAmount,
        basePayApplied,
      },
    });

    await transaction.save();

    // Update user's unlocked videos
    user.videosUnlocked.push(videoId);
    user.totalTipsSpent += finalAmount;
    await user.save();

    // Update video stats
    video.totalUnlocks += 1;
    video.totalTipsEarned += finalAmount;
    await video.save();

    // Update creator's earnings
    await (User as any).findByIdAndUpdate(video.creator, {
      $inc: { totalTipsEarned: finalAmount }
    });

    return {
      success: true,
      data: {
        transaction,
        video,
        user
      }
    };
  } catch (error) {
    console.error('Error unlocking video:', error);
    return {
      success: false,
      error: 'Failed to unlock video'
    };
  }
}

// Record video view
export async function recordVideoView(videoId: string, userId?: string) {
  try {
    // Dev-mode browser fallback: no-op with success
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      return {
        success: true,
        data: { videoId, userId }
      };
    }

    await connectDB();

    // Verify video exists
    const video = await (Video as any).findById(videoId);
    if (!video) {
      return {
        success: false,
        error: 'Video not found'
      };
    }

    // Update video view count
    await (Video as any).findByIdAndUpdate(videoId, {
      $inc: { totalViews: 1 }
    });

    // If user is provided, gate by credits and update stats
    if (userId) {
      const user = await (User as any).findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // ALL videos now require credits - no free videos
      // Require available credits (stop when credits reach 0)
      if (!user.viewCredits || user.viewCredits <= 0) {
        return {
          success: false,
          error: 'Insufficient view credits'
        };
      }
      // Deduct one credit for ALL videos
      user.viewCredits -= 1;
      await user.save();

      // Determine per-view attribution amount (only for non-free videos)
      const isFree = !!video.isFree;
      let perViewAmount = 0;
      let transaction: any = null;

      if (!isFree) {
        perViewAmount = getPerViewChargeAmount();
        const { finalAmount, basePayAmount, basePayApplied } = applyBasePay(perViewAmount);

        // Record view transaction (paid by credits)
        transaction = new Transaction({
          user: userId,
          video: videoId,
          type: 'view',
          amount: finalAmount,
          amountDisplay: formatUSDC(finalAmount),
          paymentMethod: 'credit',
          status: 'completed',
          metadata: {
            basePayAmount,
            basePayApplied,
            deductedCredits: 1,
          },
        });
        await transaction.save();

        // Update video earnings and creator earnings by per-view amount
        await (Video as any).findByIdAndUpdate(videoId, {
          $inc: { totalTipsEarned: finalAmount }
        });
        await (User as any).findByIdAndUpdate(video.creator, {
          $inc: { totalTipsEarned: finalAmount }
        });
      } else {
        // For free videos, still deduct credits but record zero-amount transaction
        transaction = new Transaction({
          user: userId,
          video: videoId,
          type: 'view',
          amount: 0,
          amountDisplay: 'FREE',
          paymentMethod: 'credit',
          status: 'completed',
          metadata: { deductedCredits: 1, basePayApplied: false, basePayAmount: 0 },
        });
        await transaction.save();
      }

      // Update user's watched set (no spend here - spend recorded at purchase time)
      await (User as any).findByIdAndUpdate(userId, {
        $addToSet: { videosWatched: videoId }
      });

      return {
        success: true,
        data: {
          transaction,
          videoId,
          userId,
          remainingCredits: user.viewCredits,
        }
      };
    }

    // No user provided; just record view
    return {
      success: true,
      data: { videoId }
    };
  } catch (error) {
    console.error('Error recording video view:', error);
    return {
      success: false,
      error: 'Failed to record view'
    };
  }
}

// Function to deduct credit when video starts playing
export async function deductCreditOnPlay(walletAddress: string, videoId: string) {
  try {
    const response = await fetch('/api/videos/deduct-credit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        videoId
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to deduct credit');
    }

    return {
      success: true,
      data: {
        remainingCredits: data.remainingCredits,
        transaction: data.transaction,
        message: data.message
      }
    };
  } catch (error) {
    console.error('Error deducting credit on play:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}