import mongoose, { Document, Schema, Model, Query } from 'mongoose';

export interface ICreator extends Document {
  wallet_address: string;
  username: string;
  bio?: string;
  profile_image_url?: string;
  total_earned_usdc: number;
  joined_at: Date;
  // Additional fields for creator functionality
  isVerified: boolean;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  uploadedVideos: mongoose.Types.ObjectId[];
  totalViews: number;
  followerCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  updateEarnings(amount: number): Promise<ICreator>;
  addUploadedVideo(videoId: mongoose.Types.ObjectId): Promise<ICreator>;
}

// Add interface for static methods
export interface ICreatorModel extends Model<ICreator> {
  findByWallet(walletAddress: string): Query<ICreator | null, ICreator>;
  getTopEarners(limit?: number): Promise<ICreator[]>;
}

const CreatorSchema = new Schema<ICreator>({
  wallet_address: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true
  },
  bio: {
    type: String,
    maxlength: 500,
    trim: true
  },
  profile_image_url: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Profile image URL must be a valid HTTP/HTTPS URL'
    }
  },
  total_earned_usdc: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },
  joined_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  socialLinks: {
    twitter: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9_]+$/.test(v);
        },
        message: 'Invalid Twitter URL format'
      }
    },
    instagram: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+$/.test(v);
        },
        message: 'Invalid Instagram URL format'
      }
    },
    youtube: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/(www\.)?youtube\.com\/(channel\/|c\/|user\/)?[a-zA-Z0-9_-]+$/.test(v);
        },
        message: 'Invalid YouTube URL format'
      }
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Website must be a valid HTTP/HTTPS URL'
      }
    }
  },
  uploadedVideos: [{
    type: Schema.Types.ObjectId,
    ref: 'Video'
  }],
  totalViews: {
    type: Number,
    default: 0,
    min: 0
  },
  followerCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'creators'
});

// Indexes for better query performance
CreatorSchema.index({ wallet_address: 1 });
CreatorSchema.index({ username: 1 });
CreatorSchema.index({ total_earned_usdc: -1 });
CreatorSchema.index({ joined_at: -1 });
CreatorSchema.index({ totalViews: -1 });
CreatorSchema.index({ isActive: 1, isVerified: 1 });

// Virtual for creator profile URL
CreatorSchema.virtual('profileUrl').get(function() {
  return `/creator/${this.username}`;
});

// Method to update earnings
CreatorSchema.methods.updateEarnings = function(amount: number) {
  this.total_earned_usdc += amount;
  return this.save();
};

// Method to add uploaded video
CreatorSchema.methods.addUploadedVideo = function(videoId: mongoose.Types.ObjectId) {
  if (!this.uploadedVideos.includes(videoId)) {
    this.uploadedVideos.push(videoId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to find by wallet address
CreatorSchema.statics.findByWallet = function(walletAddress: string) {
  return this.findOne({ wallet_address: walletAddress.toLowerCase() });
};

// Static method to get top earners
CreatorSchema.statics.getTopEarners = function(limit: number = 10) {
  return this.find({ isActive: true })
    .sort({ total_earned_usdc: -1 })
    .limit(limit)
    .select('username profile_image_url total_earned_usdc totalViews isVerified');
};

// Pre-save middleware to ensure wallet address is lowercase
CreatorSchema.pre('save', function(next) {
  if (this.wallet_address) {
    this.wallet_address = this.wallet_address.toLowerCase();
  }
  next();
});

const Creator = (mongoose.models.Creator || mongoose.model<ICreator, ICreatorModel>('Creator', CreatorSchema)) as ICreatorModel;

export default Creator;