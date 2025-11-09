import { connectDB } from './database';
import User from '../../src/models/User';

export interface WalletVerificationResult {
  verified: boolean;
  userId?: string;
  walletAddress?: string;
  credits?: number;
  error?: string;
}

/**
 * Verify wallet connection and get user details
 */
export async function verifyWalletConnection(
  walletAddress: string
): Promise<WalletVerificationResult> {
  try {
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return {
        verified: false,
        error: 'Invalid wallet address format'
      };
    }

    await connectDB();

    // Find user by wallet address
    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase()
    });

    if (!user) {
      return {
        verified: false,
        error: 'Wallet not connected to any account'
      };
    }

    return {
      verified: true,
      userId: user._id.toString(),
      walletAddress: user.walletAddress,
      credits: user.viewCredits || 0
    };

  } catch (error) {
    console.error('Wallet verification error:', error);
    return {
      verified: false,
      error: 'System error during wallet verification'
    };
  }
}

/**
 * Check if user has sufficient credits for video access
 */
export async function checkUserCredits(
  walletAddress: string,
  requiredCredits: number = 1
): Promise<{
  hasCredits: boolean;
  currentCredits: number;
  requiredCredits: number;
}> {
  try {
    const verification = await verifyWalletConnection(walletAddress);

    if (!verification.verified) {
      return {
        hasCredits: false,
        currentCredits: 0,
        requiredCredits
      };
    }

    return {
      hasCredits: (verification.credits || 0) >= requiredCredits,
      currentCredits: verification.credits || 0,
      requiredCredits
    };

  } catch (error) {
    console.error('Credit check error:', error);
    return {
      hasCredits: false,
      currentCredits: 0,
      requiredCredits
    };
  }
}

/**
 * Get wallet connection status for a user
 */
export async function getWalletConnectionStatus(
  userId: string
): Promise<{
  connected: boolean;
  walletAddress?: string;
  credits?: number;
}> {
  try {
    await connectDB();

    const user = await User.findById(userId);

    if (!user || !user.walletAddress) {
      return {
        connected: false
      };
    }

    return {
      connected: true,
      walletAddress: user.walletAddress,
      credits: user.viewCredits || 0
    };

  } catch (error) {
    console.error('Wallet status check error:', error);
    return {
      connected: false
    };
  }
}