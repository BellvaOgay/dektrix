import mongoose, { Schema } from 'mongoose';

const VideoSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  thumbnail: { type: String, required: true },
  videoUrl: { type: String, required: true },
  duration: { type: Number, required: true, min: 1, max: 300 },
  category: { type: String, required: true, enum: ['AI Agents', 'DeFi', 'Blockchain', 'NFTs', 'Web3', 'Crypto', 'Smart Contracts', 'DAOs'] },
  tags: [{ type: String, trim: true, maxlength: 30 }],
  price: { type: Number, required: true, min: 0 },
  priceDisplay: { type: String, required: true },
  tipAmount: { type: Number, default: 100000, required: true },
  tipAmountDisplay: { type: String, default: '0.1 USDC', required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  totalViews: { type: Number, default: 0, min: 0 },
  totalUnlocks: { type: Number, default: 0, min: 0 },
  totalTipsEarned: { type: Number, default: 0, min: 0 },
  playCount: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  isFree: { type: Boolean, default: false },
}, { timestamps: true });

if (typeof window === 'undefined') {
  VideoSchema.index({ category: 1, isActive: 1 });
  VideoSchema.index({ featured: -1, createdAt: -1 });
  VideoSchema.index({ creator: 1 });
  VideoSchema.index({ totalViews: -1 });
  VideoSchema.index({ price: 1 });
  VideoSchema.index({ tags: 1 });
  VideoSchema.index({ isFree: 1 });
}

let Video;
if (typeof window !== 'undefined') {
  Video = {};
} else {
  Video = mongoose.models.Video || mongoose.model('Video', VideoSchema);
}

export default Video;
