import { connectDB } from '../_lib/database.js';
import User from '../../src/models/User.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, creditsToAdd } = req.body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address is required' 
      });
    }

    if (!creditsToAdd || typeof creditsToAdd !== 'number' || creditsToAdd <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid credits amount is required' 
      });
    }

    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    // Find user by wallet address
    console.log('🔍 Finding user:', walletAddress.toLowerCase());
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Add credits to user
    const add = Math.max(creditsToAdd, 0);
    const previousCredits = user.viewCredits || 0;
    user.viewCredits = previousCredits + add;

    console.log('💰 Adding credits:', { previousCredits, add, newTotal: user.viewCredits });
    await user.save();
    console.log('✅ Credits updated successfully');

    return res.status(200).json({ 
      success: true, 
      data: {
        walletAddress: user.walletAddress,
        viewCredits: user.viewCredits,
        creditsAdded: add
      }
    });

  } catch (error: any) {
    console.error('❌ Error adding credits:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}