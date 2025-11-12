import connectDB from '../lib/database';
import User from '../models/User.js';
import Video from '../models/Video.js';
import type { IUser } from '../models/User.ts';

const API_BASE: string = (import.meta as any)?.env?.DEV ? ((import.meta as any)?.env?.VITE_API_BASE_URL || '') : '';

// Create or get user by wallet address
export async function createOrGetUserByWallet(walletAddress: string, userData?: {
  username?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
}) {
  try {
    await connectDB();

    // Check if user already exists
    let user = await (User as any).findOne({ walletAddress: walletAddress.toLowerCase() });

    if (user) {
      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      return {
        success: true,
        data: user,
        isNewUser: false
      };
    } else {
      // Create new user with wallet address
      const username = userData?.username || `user_${walletAddress.slice(-8)}`;

      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        username: username,
        displayName: userData?.displayName || username,
        avatar: userData?.avatar || '',
        bio: userData?.bio || '',
        totalTipsEarned: 0,
        totalTipsSpent: 0,
        videosWatched: [],
        videosUnlocked: [],
        favoriteCategories: [],
        viewCredits: 1, // Give new users 1 free credit to start
        userContainer: {
          purchasedVideos: [],
          uploadedVideos: [],
          watchHistory: [],
          preferences: {
            autoPlay: true,
            notifications: true,
            theme: 'auto'
          }
        },
        isActive: true,
        lastLoginAt: new Date()
      });

      await user.save();

      return {
        success: true,
        data: user,
        isNewUser: true
      };
    }
  } catch (error) {
    console.error('Error creating/getting user by wallet:', error);
    return {
      success: false,
      error: 'Failed to create or get user by wallet address'
    };
  }
}

// Get user by wallet address
export async function getUserByWallet(walletAddress: string) {
  try {
    await connectDB();

    const user = await (User as any).findOne({ walletAddress: walletAddress.toLowerCase() })
      .populate('userContainer.purchasedVideos', 'title thumbnail duration price')
      .populate('userContainer.uploadedVideos', 'title thumbnail duration')
      .populate('userContainer.watchHistory.videoId', 'title thumbnail')
      .lean();

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      data: user
    };
  } catch (error) {
    console.error('Error fetching user by wallet:', error);
    return {
      success: false,
      error: 'Failed to fetch user'
    };
  }
}

// Add video to user's purchased videos
export async function addPurchasedVideo(walletAddress: string, videoId: string) {
  try {
    await connectDB();

    const user = await (User as any).findOne({ walletAddress: walletAddress.toLowerCase() });

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Check if video is already purchased
    if (!user.userContainer.purchasedVideos.includes(videoId)) {
      user.userContainer.purchasedVideos.push(videoId);
      await user.save();
    }

    return {
      success: true,
      data: user
    };
  } catch (error) {
    console.error('Error adding purchased video:', error);
    return {
      success: false,
      error: 'Failed to add purchased video'
    };
  }
}

// Update user's watch history
export async function updateWatchHistory(walletAddress: string, videoId: string, progress: number) {
  try {
    await connectDB();

    const user = await (User as any).findOne({ walletAddress: walletAddress.toLowerCase() });

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Find existing watch history entry
    const existingEntry = user.userContainer.watchHistory.find(
      (entry: any) => entry.videoId.toString() === videoId
    );

    if (existingEntry) {
      // Update existing entry
      existingEntry.progress = Math.max(existingEntry.progress, progress);
      existingEntry.watchedAt = new Date();
    } else {
      // Add new entry
      user.userContainer.watchHistory.push({
        videoId: videoId,
        watchedAt: new Date(),
        progress: progress
      });
    }

    // Also update the legacy videosWatched array for backward compatibility
    if (!user.videosWatched.includes(videoId)) {
      user.videosWatched.push(videoId);
    }

    await user.save();

    return {
      success: true,
      data: user
    };
  } catch (error) {
    console.error('Error updating watch history:', error);
    return {
      success: false,
      error: 'Failed to update watch history'
    };
  }
}

// Update user preferences
export async function updateUserPreferences(walletAddress: string, preferences: {
  autoPlay?: boolean;
  notifications?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}) {
  try {
    await connectDB();

    const user = await (User as any).findOne({ walletAddress: walletAddress.toLowerCase() });

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Update preferences
    if (preferences.autoPlay !== undefined) {
      user.userContainer.preferences.autoPlay = preferences.autoPlay;
    }
    if (preferences.notifications !== undefined) {
      user.userContainer.preferences.notifications = preferences.notifications;
    }
    if (preferences.theme !== undefined) {
      user.userContainer.preferences.theme = preferences.theme;
    }

    await user.save();

    return {
      success: true,
      data: user
    };
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return {
      success: false,
      error: 'Failed to update user preferences'
    };
  }
}

// Create or update user from Farcaster data
export async function createOrUpdateUser(farcasterData: {
  fid: number;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  walletAddress?: string;
}) {
  try {
    await connectDB();

    let user = await (User as any).findOne({ fid: farcasterData.fid });

    if (user) {
      // Update existing user
      user.username = farcasterData.username;
      user.displayName = farcasterData.displayName;
      user.avatar = farcasterData.avatar || user.avatar;
      user.bio = farcasterData.bio || user.bio;
      user.walletAddress = farcasterData.walletAddress || user.walletAddress;
      user.lastLoginAt = new Date();

      await user.save();
    } else {
      // Create new user
      user = new User({
        fid: farcasterData.fid,
        username: farcasterData.username,
        displayName: farcasterData.displayName,
        avatar: farcasterData.avatar,
        bio: farcasterData.bio,
        walletAddress: farcasterData.walletAddress,
        viewCredits: 0,
        lastLoginAt: new Date()
      });

      await user.save();
    }

    return {
      success: true,
      data: user
    };
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return {
      success: false,
      error: 'Failed to create or update user'
    };
  }
}

// Get user by ID
export async function getUserById(userId: string) {
  try {
    await connectDB();

    const user = await (User as any).findById(userId)
      .populate('videosUnlocked', 'title thumbnail duration')
      .populate('videosWatched', 'title thumbnail duration')
      .lean();

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      data: user
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      success: false,
      error: 'Failed to fetch user'
    };
  }
}

// Get user by Farcaster ID
export async function getUserByFid(fid: number) {
  try {
    await connectDB();

    const user = await (User as any).findOne({ fid }).lean();

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      data: user
    };
  } catch (error) {
    console.error('Error fetching user by FID:', error);
    return {
      success: false,
      error: 'Failed to fetch user'
    };
  }
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<IUser>) {
  try {
    await connectDB();

    const allowedUpdates = [
      'displayName',
      'bio',
      'avatar',
      'walletAddress',
      'favoriteCategories',
      'preferences'
    ];

    const filteredUpdates: any = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key as keyof IUser];
      }
    });

    const updatedUser = await (User as any).findByIdAndUpdate(
      userId,
      filteredUpdates,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      data: updatedUser
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: 'Failed to update profile'
    };
  }
}

// Get user's unlocked videos
export async function getUserUnlockedVideos(userId: string) {
  try {
    await connectDB();

    const user = await (User as any).findById(userId)
      .populate({
        path: 'videosUnlocked',
        populate: {
          path: 'creator',
          select: 'username displayName avatar'
        }
      })
      .lean();

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      data: user.videosUnlocked
    };
  } catch (error) {
    console.error('Error fetching user unlocked videos:', error);
    return {
      success: false,
      error: 'Failed to fetch unlocked videos'
    };
  }
}

// Get user's watch history
export async function getUserWatchHistory(userId: string) {
  try {
    await connectDB();

    const user = await (User as any).findById(userId)
      .populate({
        path: 'videosWatched',
        populate: {
          path: 'creator',
          select: 'username displayName avatar'
        }
      })
      .lean();

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      data: user.videosWatched
    };
  } catch (error) {
    console.error('Error fetching user watch history:', error);
    return {
      success: false,
      error: 'Failed to fetch watch history'
    };
  }
}

// Get user statistics
export async function getUserStats(userId: string) {
  try {
    await connectDB();

    const user = await (User as any).findById(userId).lean();

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const stats = {
      videosUnlocked: user.videosUnlocked.length,
      videosWatched: user.videosWatched.length,
      totalTipsSpent: user.totalTipsSpent,
      totalTipsEarned: user.totalTipsEarned,
      joinedAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      success: false,
      error: 'Failed to fetch user stats'
    };
  }
}

export async function getViewCredits(walletAddress: string) {
  try {
    await connectDB();
    const user = await (User as any).findOne({ walletAddress: walletAddress.toLowerCase() }).lean();
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: { viewCredits: user.viewCredits } };
  } catch (error) {
    console.error('Error getting view credits:', error);
    return { success: false, error: 'Failed to get view credits' };
  }
}

export async function addViewCredits(walletAddress: string, creditsToAdd: number) {
  try {
    const tryRequest = async (url: string, payload: any) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response;
    };

    let response = await tryRequest(`${API_BASE}/api/users/actions?slug=${encodeURIComponent(walletAddress)},add-credits`, { amount: creditsToAdd });
    if (!response.ok && response.status === 404) {
      response = await tryRequest(`${API_BASE}/api/users/${walletAddress}/actions?action=add-credits`, { amount: creditsToAdd });
      if (!response.ok && response.status === 404) {
        response = await tryRequest(`${API_BASE}/api/users/add-credits`, { walletAddress, creditsToAdd });
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errJson = await response.clone().json();
        errorMessage = errJson.error || errorMessage;
      } catch {
        try {
          const errText = await response.clone().text();
          errorMessage = `${errorMessage}, response: ${errText}`;
        } catch {}
      }
      return { success: false, error: errorMessage };
    }

    try {
      const result = await response.json();
      return result;
    } catch {
      const text = await response.clone().text();
      return { success: false, error: `Invalid response format: ${text.slice(0, 200)}` };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Network error: ${error?.message || 'Failed to add view credits'}`
    };
  }
}

export async function getUserCredits(walletAddress: string) {
  try {
    console.log('🔄 Fetching user credits via API:', { walletAddress });

    const response = await fetch(`${API_BASE}/api/users/${walletAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, use text response
        const textError = await response.text();
        console.error('❌ Failed to fetch user credits (non-JSON):', response.status, textError);
        return {
          success: false,
          error: `HTTP error! status: ${response.status}, response: ${textError}`
        };
      }
      
      console.error('❌ Failed to fetch user credits:', errorData);
      return {
        success: false,
        error: errorData.error || 'Failed to fetch user credits'
      };
    }

    const result = await response.json();
    console.log('✅ User credits fetched successfully:', result);
    
    // Vercel API returns full user data, extract just the credits
    if (result.success && result.data) {
      return {
        success: true,
        data: { viewCredits: result.data.viewCredits }
      };
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Error fetching user credits:', error);
    return {
      success: false,
      error: `Network error: ${error.message || 'Failed to fetch user credits'}`
    };
  }
}

// Withdraw tips (minimum 5 USDC)
export async function withdrawTips(walletAddress: string, amount: number) {
  try {
    console.log('🔄 Withdrawing tips via API:', { walletAddress, amount });

    const response = await fetch(`${API_BASE}/api/users/actions/${walletAddress}/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        recipientAddress: walletAddress
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Failed to withdraw tips:', errorData);
      return {
        success: false,
        error: errorData.error || 'Failed to withdraw tips'
      };
    }

    const result = await response.json();
    console.log('✅ Tips withdrawn successfully:', result);
    return result;
  } catch (error: any) {
    console.error('❌ Error withdrawing tips:', error);
    return {
      success: false,
      error: `Network error: ${error.message || 'Failed to withdraw tips'}`
    };
  }
}
