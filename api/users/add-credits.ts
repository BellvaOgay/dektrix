import { connectDB } from '../_lib/database';
import User from '../../src/models/User';

interface ApiRequest {
  method: string;
  body: { [key: string]: any };
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: any) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
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

    await connectDB();

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Add credits to user
    const add = Math.max(creditsToAdd, 0);
    user.viewCredits = (user.viewCredits || 0) + add;
    await user.save();

    console.log(`✅ Added ${add} credits to user ${walletAddress}. New balance: ${user.viewCredits}`);

    return res.status(200).json({
      success: true,
      data: {
        viewCredits: user.viewCredits,
        creditsAdded: add,
        user: {
          _id: user._id,
          username: user.username,
          walletAddress: user.walletAddress,
          viewCredits: user.viewCredits
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error adding view credits:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to add view credits' 
    });
  }
}