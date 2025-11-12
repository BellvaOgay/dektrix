import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getWalletConnectionStatus, verifyWalletConnection } from './_lib/wallet-verification.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { wallet, userId } = req.query;

    // If wallet address provided, verify it
    if (wallet && typeof wallet === 'string') {
      const verification = await verifyWalletConnection(wallet);
      
      return res.status(200).json({
        success: true,
        connected: verification.verified,
        walletAddress: verification.walletAddress,
        credits: verification.credits,
        error: verification.error
      });
    }

    // If user ID provided, check their wallet status
    if (userId && typeof userId === 'string') {
      const status = await getWalletConnectionStatus(userId);
      
      return res.status(200).json({
        success: true,
        connected: status.connected,
        walletAddress: status.walletAddress,
        credits: status.credits
      });
    }

    // No credentials provided
    return res.status(200).json({
      success: true,
      connected: false,
      error: 'No wallet address or user ID provided'
    });

  } catch (error) {
    console.error('Wallet status API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}