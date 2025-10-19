import connectDB from '../lib/database';
import Transaction from '../models/Transaction';
import User from '../models/User';
import Video from '../models/Video';
import type { ITransaction } from '../models/Transaction';
import { applyBasePay } from '../lib/utils';

// Get user's transaction history
export async function getUserTransactions(userId: string, options?: {
  type?: 'unlock' | 'tip' | 'refund';
  status?: 'pending' | 'completed' | 'failed';
  limit?: number;
  skip?: number;
}) {
  try {
    await connectDB();
    
    const query: any = { user: userId };
    
    if (options?.type) {
      query.type = options.type;
    }
    
    if (options?.status) {
      query.status = options.status;
    }
    
    const transactions = await (Transaction as any).find(query)
      .populate('video', 'title thumbnail duration price')
      .sort({ createdAt: -1 })
      .limit(options?.limit || 20)
      .skip(options?.skip || 0)
      .lean();
    
    return {
      success: true,
      data: transactions
    };
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return {
      success: false,
      error: 'Failed to fetch transactions'
    };
  }
}

// Get transaction by ID
export async function getTransactionById(transactionId: string) {
  try {
    await connectDB();
    
    const transaction = await (Transaction as any).findById(transactionId)
      .populate('user', 'username displayName avatar')
      .populate('video', 'title thumbnail duration price creator')
      .lean();
    
    if (!transaction) {
      return {
        success: false,
        error: 'Transaction not found'
      };
    }
    
    return {
      success: true,
      data: transaction
    };
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return {
      success: false,
      error: 'Failed to fetch transaction'
    };
  }
}

// Create a new transaction
export async function createTransaction(transactionData: {
  user: string;
  video: string;
  type: 'unlock' | 'tip' | 'refund';
  amount: number;
  amountDisplay: string;
  paymentMethod: 'crypto' | 'farcaster' | 'credit';
  transactionHash?: string;
  metadata?: any;
}) {
  try {
    await connectDB();
    
    const { finalAmount, basePayAmount, basePayApplied } = applyBasePay(transactionData.amount);

    const transaction = new Transaction({
      ...transactionData,
      amount: finalAmount,
      metadata: {
        ...(transactionData.metadata || {}),
        basePayAmount,
        basePayApplied,
      },
      status: 'pending'
    });
    
    await transaction.save();
    
    return {
      success: true,
      data: transaction
    };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return {
      success: false,
      error: 'Failed to create transaction'
    };
  }
}

// Update transaction status
export async function updateTransactionStatus(
  transactionId: string,
  status: 'pending' | 'completed' | 'failed',
  metadata?: any
) {
  try {
    await connectDB();
    
    const updateData: any = { status };
    if (metadata) {
      updateData.metadata = metadata;
    }
    
    const transaction = await (Transaction as any).findByIdAndUpdate(
      transactionId,
      updateData,
      { new: true }
    ).lean();
    
    if (!transaction) {
      return {
        success: false,
        error: 'Transaction not found'
      };
    }
    
    return {
      success: true,
      data: transaction
    };
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return {
      success: false,
      error: 'Failed to update transaction'
    };
  }
}

// Process tip transaction
export async function processTip(
  fromUserId: string,
  toUserId: string,
  videoId: string,
  amount: number,
  amountDisplay: string,
  paymentMethod: 'crypto' | 'farcaster' | 'credit',
  transactionHash?: string
) {
  try {
    await connectDB();
    
    // Verify users and video exist
    const [fromUser, toUser, video] = await Promise.all([
      (User as any).findById(fromUserId),
      (User as any).findById(toUserId),
      (Video as any).findById(videoId)
    ]);
    
    if (!fromUser || !toUser || !video) {
      return {
        success: false,
        error: 'User or video not found'
      };
    }
    
    const { finalAmount, basePayAmount, basePayApplied } = applyBasePay(amount);

    // Create transaction
    const transaction = new Transaction({
      user: fromUserId,
      video: videoId,
      type: 'tip',
      amount: finalAmount,
      amountDisplay,
      paymentMethod,
      transactionHash,
      status: 'completed',
      metadata: {
        basePayAmount,
        basePayApplied,
      }
    });
    
    await transaction.save();
    
    // Update user balances
    fromUser.totalTipsSpent += finalAmount;
    toUser.totalTipsEarned += finalAmount;
    
    await Promise.all([
      fromUser.save(),
      toUser.save()
    ]);
    
    // Update video stats
    video.totalTipsEarned += finalAmount;
    await video.save();
    
    return {
      success: true,
      data: {
        transaction,
        fromUser,
        toUser,
        video
      }
    };
  } catch (error) {
    console.error('Error processing tip:', error);
    return {
      success: false,
      error: 'Failed to process tip'
    };
  }
}

// Get transaction statistics
export async function getTransactionStats(userId?: string) {
  try {
    await connectDB();
    
    const query = userId ? { user: userId } : {};
    
    const [totalTransactions, completedTransactions, totalVolume] = await Promise.all([
      Transaction.countDocuments(query),
      Transaction.countDocuments({ ...query, status: 'completed' }),
      Transaction.aggregate([
        { $match: { ...query, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    
    const stats = {
      totalTransactions,
      completedTransactions,
      failedTransactions: totalTransactions - completedTransactions,
      totalVolume: totalVolume[0]?.total || 0
    };
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    return {
      success: false,
      error: 'Failed to fetch transaction stats'
    };
  }
}