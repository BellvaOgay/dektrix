import { logger } from '@/lib/logger';
import connectDB from '../lib/database';
import Video from '../models/Video.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import type { IVideo } from '../models/Video.ts';
import type { IUser } from '../models/User.ts';
import { applyBasePay, getPerViewChargeAmount, formatUSDC, calculateBasePayPrice, isBasePayEnabled } from '../lib/utils';
import { discoverLocalVideos, generateVideoMetadata } from '@/utils/videoScanner';

// Function to scan local videos folder and generate video metadata
async function scanLocalVideos() {
  try {
    // Use the video scanner utility to discover local videos
    const discoveredVideos = await discoverLocalVideos();

    return discoveredVideos.map((video, index) => ({
      _id: `local_${Date.now()}_${index}`,
      title: video.title,
      category: video.category,
      duration: video.duration,
      price: 0,
      priceDisplay: 'Free',
      thumbnail: '/placeholder.svg',
      isFree: true,
      isUnlocked: true,
      videoUrl: `/videos/${video.filename}`,
      description: video.description,
      totalViews: Math.floor(Math.random() * 1000),
      totalUnlocks: Math.floor(Math.random() * 500),
      playCount: Math.floor(Math.random() * 200),
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 30), // Random date within last 30 days
      isActive: true,
      creator: {
        _id: 'local_creator',
        username: 'local_system',
        displayName: 'Local System',
        walletAddress: '0x0000000000000000000000000000000000000000'
      }
    }));
  } catch (error) {
    console.error('Error scanning local videos:', error);
    // Fallback to hardcoded list if scanning fails - updated to match public folder
    const fallbackVideos = [
      { filename: 'Ep1.mp4', title: 'Episode 1', category: 'Entertainment', duration: 25 },
      { filename: 'Eps2.mp4', title: 'Episode 2', category: 'Entertainment', duration: 30 },
      { filename: 'Ep3.mp4', title: 'Episode 3', category: 'Entertainment', duration: 28 },
      { filename: 'Ep4.mp4', title: 'Episode 4', category: 'Entertainment', duration: 32 },
      { filename: 'Ep5.mp4', title: 'Episode 5', category: 'Entertainment', duration: 35 }
    ];

    return fallbackVideos.map((video, index) => ({
      _id: `local_${Date.now()}_${index}`,
      title: video.title,
      category: video.category,
      duration: video.duration,
      price: 100000, // 0.1 USDC (matches database pricing)
      priceDisplay: '0.1 USDC',
      thumbnail: '/placeholder.svg',
      isFree: false, // Most videos should be paid
      isUnlocked: false, // Videos should start locked
      videoUrl: `/videos/${video.filename}`,
      description: `Local video: ${video.title}`,
      totalViews: Math.floor(Math.random() * 1000),
      totalUnlocks: Math.floor(Math.random() * 500),
      playCount: Math.floor(Math.random() * 200),
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 30),
      isActive: true,
      creator: {
        _id: 'local_creator',
        username: 'local_system',
        displayName: 'Local System',
        walletAddress: '0x0000000000000000000000000000000000000000'
      }
    }));
  }
}

// Mock storage for browser environment - now dynamically generated from local videos
let mockVideos: any[] = [];

// Initialize mock videos asynchronously
async function initializeMockVideos() {
  try {
    const localVideos = await scanLocalVideos();
    // scanLocalVideos() already returns the transformed format, so just assign it
    mockVideos = localVideos;
    console.log('✅ Local videos initialized:', mockVideos.length, 'videos found');
  } catch (error) {
    console.error('❌ Failed to initialize local videos:', error);
    // Fallback to empty array
    mockVideos = [];
  }
}

// Initialize on module load
initializeMockVideos();

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
      const params = new URLSearchParams();
      if (filters?.category) params.set('category', filters.category);
      if (filters?.featured !== undefined) params.set('featured', String(filters.featured));
      if (filters?.limit !== undefined) params.set('limit', String(filters.limit));
      if (filters?.skip !== undefined) params.set('skip', String(filters.skip));

      // In dev mode, try API first, fallback to mock if not available
      if (import.meta.env.DEV) {
        try {
          const res = await fetch(`/api/videos?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            return json;
          } else {
            console.warn('API not available in dev mode, using mock data');
            return { success: true, data: mockVideos.slice(0, filters?.limit || 20) };
          }
        } catch (e) {
          console.warn('API request failed in dev mode, using mock data:', e);
          return { success: true, data: mockVideos.slice(0, filters?.limit || 20) };
        }
      }

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
    // In browser environment, use serverless API for persistence
    if (typeof window !== 'undefined') {
      logger.debug('🌐 Creating video via API endpoint');

      // In dev mode, check if we can reach the API
      if (import.meta.env.DEV) {
        try {
          const response = await fetch('/api/videos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(videoData),
          });

          if (response.ok) {
            const result = await response.json();
            return result;
          } else {
            console.warn('API not available in dev mode, falling back to mock storage');
            // Fallback to mock storage in dev mode if API is not available
            const newVideo = {
              _id: Date.now().toString(),
              ...videoData,
              createdAt: new Date(),
              updatedAt: new Date(),
              totalViews: 0,
              totalUnlocks: 0,
              totalTipsEarned: 0,
              playCount: 0,
              isActive: true,
              creator: {
                _id: videoData.creatorWallet?.toLowerCase(),
                username: `user_${videoData.creatorWallet?.slice(-8)}`,
                displayName: `User ${videoData.creatorWallet?.slice(-8)}`,
                walletAddress: videoData.creatorWallet
              }
            };
            mockVideos.push(newVideo);
            return { success: true, data: newVideo };
          }
        } catch (error) {
          console.warn('API request failed in dev mode, using mock storage:', error);
          // Fallback to mock storage if API request fails
          const newVideo = {
            _id: Date.now().toString(),
            ...videoData,
            createdAt: new Date(),
            updatedAt: new Date(),
            totalViews: 0,
            totalUnlocks: 0,
            totalTipsEarned: 0,
            playCount: 0,
            isActive: true,
            creator: {
              _id: videoData.creatorWallet?.toLowerCase(),
              username: `user_${videoData.creatorWallet?.slice(-8)}`,
              displayName: `User ${videoData.creatorWallet?.slice(-8)}`,
              walletAddress: videoData.creatorWallet
            }
          };
          mockVideos.push(newVideo);
          return { success: true, data: newVideo };
        }
      } else {
        // Production mode - always use API
        const response = await fetch('/api/videos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(videoData),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        return result;
      }
    }

    // Server-side database operations
    await connectDB();
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

    // If user is provided, record view without gating by credits
    if (userId) {
      const user = await (User as any).findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }
      // Update user's watched set
      await (User as any).findByIdAndUpdate(userId, {
        $addToSet: { videosWatched: videoId }
      });

      return {
        success: true,
        data: {
          videoId,
          userId,
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

// Function to increment play count when video is played
export async function incrementPlayCount(videoId: string) {
  try {
    const response = await fetch('/api/videos/increment-play-count', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to increment play count');
    }

    return {
      success: true,
      data: {
        playCount: data.playCount,
        message: data.message
      }
    };
  } catch (error) {
    console.error('Error incrementing play count:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
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
      return {
        success: false,
        error: data.error || 'Failed to deduct credit'
      };
    }

    return {
      success: true,
      data: {
        remainingCredits: data.remainingCredits,
        transaction: data.transaction,
        message: data.message || 'Credit deducted successfully'
      }
    };
  } catch (error) {
    console.error('Error deducting credit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Function to tip a video creator
export async function tipVideo(videoId: string, tipperWallet: string, amount: number) {
  try {
    const response = await fetch('/api/videos/tip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId,
        tipperWallet,
        amount
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send tip');
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
    console.error('Error sending tip:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Function to upload a video
export async function uploadVideo(formData: FormData) {
  try {
    const response = await fetch('/api/videos/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload video');
    }

    return {
      success: true,
      data: {
        video: data.video,
        message: data.message
      }
    };
  } catch (error) {
    console.error('Error uploading video:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}