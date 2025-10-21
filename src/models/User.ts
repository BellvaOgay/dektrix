import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  farcasterFid?: number;
  username: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  walletAddress: string; // Made required for wallet-based users
  totalTipsEarned: number;
  totalTipsSpent: number;
  videosWatched: mongoose.Types.ObjectId[];
  videosUnlocked: mongoose.Types.ObjectId[];
  favoriteCategories: string[];
  viewCredits: number;
  // User container fields for organizing user data
  userContainer: {
    purchasedVideos: mongoose.Types.ObjectId[];
    uploadedVideos: mongoose.Types.ObjectId[];
    watchHistory: {
      videoId: mongoose.Types.ObjectId;
      watchedAt: Date;
      progress: number; // Percentage watched (0-100)
    }[];
    preferences: {
      autoPlay: boolean;
      notifications: boolean;
      theme: 'light' | 'dark' | 'auto';
    };
  };
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  farcasterFid: {
    type: Number,
    unique: true,
    sparse: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true // Add index for faster queries
  },
  totalTipsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  totalTipsSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  videosWatched: [{
    type: Schema.Types.ObjectId,
    ref: 'Video'
  }],
  videosUnlocked: [{
    type: Schema.Types.ObjectId,
    ref: 'Video'
  }],
  favoriteCategories: [{
    type: String,
    enum: ['AI Agents', 'DeFi', 'Blockchain', 'NFTs', 'Web3', 'Crypto', 'Smart Contracts', 'DAOs']
  }],
  viewCredits: {
    type: Number,
    default: 0,
    min: 0
  },
  // User container for organizing user data
  userContainer: {
    purchasedVideos: [{
      type: Schema.Types.ObjectId,
      ref: 'Video'
    }],
    uploadedVideos: [{
      type: Schema.Types.ObjectId,
      ref: 'Video'
    }],
    watchHistory: [{
      videoId: {
        type: Schema.Types.ObjectId,
        ref: 'Video',
        required: true
      },
      watchedAt: {
        type: Date,
        default: Date.now
      },
      progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    }],
    preferences: {
      autoPlay: {
        type: Boolean,
        default: true
      },
      notifications: {
        type: Boolean,
        default: true
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto'
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance (only in server environment)
if (typeof window === 'undefined') {
  UserSchema.index({ farcasterFid: 1 });
  UserSchema.index({ username: 1 });
  UserSchema.index({ walletAddress: 1 });
  UserSchema.index({ createdAt: -1 });
}

// Export the User model with browser compatibility
let User: mongoose.Model<IUser>;

if (typeof window !== 'undefined') {
  // In browser environment, create a mock model
  User = {} as mongoose.Model<IUser>;
} else {
  // In server environment, use the actual mongoose model
  User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
}

export default User;