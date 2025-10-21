import connectDB from '../lib/database';
import User from '../models/User';
import Video from '../models/Video';
import type { IUser } from '../models/User';

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
    console.log('🔄 Adding view credits via API:', { walletAddress, creditsToAdd });

    const response = await fetch('/api/users/add-credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: walletAddress,
        creditsToAdd: creditsToAdd
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API response not ok:', response.status, errorData);
      return {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`
      };
    }

    const result = await response.json();
    console.log('✅ Credits added successfully:', result);

    return result;
  } catch (error: any) {
    console.error('❌ Error adding view credits:', error);
    return {
      success: false,
      error: `Network error: ${error.message || 'Failed to add view credits'}`
    };
  }
}