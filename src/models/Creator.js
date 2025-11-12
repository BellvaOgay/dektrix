import mongoose, { Schema } from 'mongoose';

const CreatorSchema = new Schema({
  wallet_address: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30, index: true },
  bio: { type: String, maxlength: 500, trim: true },
  profile_image_url: { type: String, trim: true },
  total_earned_usdc: { type: Number, default: 0, min: 0, index: true },
  joined_at: { type: Date, default: Date.now, index: true },
  isVerified: { type: Boolean, default: false },
  socialLinks: {
    twitter: { type: String, trim: true },
    instagram: { type: String, trim: true },
    youtube: { type: String, trim: true },
    website: { type: String, trim: true },
  },
  uploadedVideos: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
  totalViews: { type: Number, default: 0, min: 0 },
  followerCount: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, collection: 'creators' });

CreatorSchema.index({ wallet_address: 1 });
CreatorSchema.index({ username: 1 });
CreatorSchema.index({ total_earned_usdc: -1 });
CreatorSchema.index({ joined_at: -1 });
CreatorSchema.index({ totalViews: -1 });
CreatorSchema.index({ isActive: 1, isVerified: 1 });

CreatorSchema.pre('save', function(next) {
  if (this.wallet_address) {
    this.wallet_address = this.wallet_address.toLowerCase();
  }
  next();
});

let Creator;
if (typeof window !== 'undefined') {
  Creator = {};
} else {
  Creator = mongoose.models.Creator || mongoose.model('Creator', CreatorSchema);
}

export default Creator;
