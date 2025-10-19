import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number; // in seconds
  category: string;
  tags: string[];
  price: number; // in wei or smallest unit
  priceDisplay: string; // human readable price like "$0.01"
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  creator: mongoose.Types.ObjectId;
  totalViews: number;
  totalUnlocks: number;
  totalTipsEarned: number;
  isActive: boolean;
  featured: boolean;
  isFree: boolean; // true for free content, false for premium content
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideo>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  thumbnail: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 300 // 5 minutes max for micro-content
  },
  category: {
    type: String,
    required: true,
    enum: ['AI Agents', 'DeFi', 'Blockchain', 'NFTs', 'Web3', 'Crypto', 'Smart Contracts', 'DAOs']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  priceDisplay: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalViews: {
    type: Number,
    default: 0,
    min: 0
  },
  totalUnlocks: {
    type: Number,
    default: 0,
    min: 0
  },
  totalTipsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  isFree: {
    type: Boolean,
    default: false // Default to premium content for safety
  }
}, {
  timestamps: true
});

// Indexes for better query performance (only in server environment)
if (typeof window === 'undefined') {
  VideoSchema.index({ category: 1, isActive: 1 });
  VideoSchema.index({ featured: -1, createdAt: -1 });
  VideoSchema.index({ creator: 1 });
  VideoSchema.index({ totalViews: -1 });
  VideoSchema.index({ price: 1 });
  VideoSchema.index({ tags: 1 });
  VideoSchema.index({ isFree: 1 }); // Index for filtering free vs premium content
}

// Export the Video model with browser compatibility
let Video: mongoose.Model<IVideo>;

if (typeof window !== 'undefined') {
  // In browser environment, create a mock model
  Video = {} as mongoose.Model<IVideo>;
} else {
  // In server environment, use the actual mongoose model
  Video = mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema);
}

export default Video;