import mongoose, { Document, Schema } from 'mongoose';

export interface IWithdrawalHistory extends Document {
  userId: mongoose.Types.ObjectId;
  walletAddress: string;
  amount: number; // Amount in wei (6 decimals for USDC)
  amountUSDC: number; // Amount in USDC for display
  transactionHash?: string; // Blockchain transaction hash (optional for now)
  status: 'pending' | 'completed' | 'failed';
  processedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalHistorySchema = new Schema<IWithdrawalHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  amountUSDC: {
    type: Number,
    required: true,
    min: 0
  },
  transactionHash: {
    type: String,
    sparse: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  processedAt: {
    type: Date
  },
  errorMessage: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for better query performance (only in server environment)
if (typeof window === 'undefined') {
  WithdrawalHistorySchema.index({ userId: 1, createdAt: -1 });
  WithdrawalHistorySchema.index({ walletAddress: 1, createdAt: -1 });
  WithdrawalHistorySchema.index({ status: 1, createdAt: -1 });
}

// Export the WithdrawalHistory model with browser compatibility
let WithdrawalHistory: mongoose.Model<IWithdrawalHistory>;

if (typeof window !== 'undefined') {
  // In browser environment, create a mock model
  WithdrawalHistory = {} as mongoose.Model<IWithdrawalHistory>;
} else {
  // In server environment, use the actual mongoose model
  WithdrawalHistory = mongoose.models.WithdrawalHistory || mongoose.model<IWithdrawalHistory>('WithdrawalHistory', WithdrawalHistorySchema);
}

export default WithdrawalHistory;