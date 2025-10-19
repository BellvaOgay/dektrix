import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  videoCount: number;
  isActive: boolean;
  featured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  icon: {
    type: String,
    required: true // Lucide icon name or emoji
  },
  color: {
    type: String,
    required: true,
    match: /^#[0-9A-F]{6}$/i // Hex color validation
  },
  videoCount: {
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
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
CategorySchema.index({ slug: 1 });
CategorySchema.index({ isActive: 1, order: 1 });
CategorySchema.index({ featured: -1, order: 1 });

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);