import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  displayName: { type: String, trim: true, maxlength: 50 },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  avatar: { type: String, default: '' },
  bio: { type: String, maxlength: 500, default: '' },
  walletAddress: { type: String, required: true, unique: true, index: true },
  totalTipsEarned: { type: Number, default: 0, min: 0 },
  totalTipsSpent: { type: Number, default: 0, min: 0 },
  videosWatched: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
  videosUnlocked: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
  videosTipped: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
  favoriteCategories: [{ type: String }],
  viewCredits: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
}, { timestamps: true });

if (typeof window === 'undefined') {
  UserSchema.index({ username: 1 });
  UserSchema.index({ walletAddress: 1 });
  UserSchema.index({ createdAt: -1 });
}

let User;
if (typeof window !== 'undefined') {
  User = {};
} else {
  User = mongoose.models.User || mongoose.model('User', UserSchema);
}

export default User;
