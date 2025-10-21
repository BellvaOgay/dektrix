import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  video: mongoose.Types.ObjectId;
  type: 'unlock' | 'tip' | 'view' | 'refund';
  amount: number; // in wei or smallest unit
  amountDisplay: string; // human readable amount
  transactionHash?: string; // blockchain transaction hash
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: 'crypto' | 'farcaster' | 'credit' | 'basepay';
  metadata?: {
    blockNumber?: number;
    gasUsed?: number;
    gasPrice?: number;
    basePayAmount?: number;
    basePayApplied?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  video: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  type: {
    type: String,
    enum: ['unlock', 'tip', 'view', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  amountDisplay: {
    type: String,
    required: true
  },
  transactionHash: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['crypto', 'farcaster', 'credit', 'basepay'],
    required: true
  },
  metadata: {
    blockNumber: Number,
    gasUsed: Number,
    gasPrice: Number,
    basePayAmount: Number,
    basePayApplied: Boolean
  }
}, {
  timestamps: true
});

// Indexes for better query performance (only in server environment)
if (typeof window === 'undefined') {
  TransactionSchema.index({ user: 1, createdAt: -1 });
  TransactionSchema.index({ video: 1, type: 1 });
  TransactionSchema.index({ transactionHash: 1 });
  TransactionSchema.index({ status: 1, createdAt: -1 });
  TransactionSchema.index({ type: 1, createdAt: -1 });
}

// Export the Transaction model with browser compatibility
let Transaction: mongoose.Model<ITransaction>;

if (typeof window !== 'undefined') {
  // In browser environment, create a mock model
  Transaction = {} as mongoose.Model<ITransaction>;
} else {
  // In server environment, use the actual mongoose model
  Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
}

export default Transaction;