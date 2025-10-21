import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectDB from '../../src/lib/database';
import Creator from '../../src/models/Creator';
import { logger } from '../../src/lib/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();
    
    const { wallet } = req.query;
    const { method } = req;
    
    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    switch (method) {
      case 'GET':
        return await getCreator(req, res, wallet);
      case 'PUT':
        return await updateCreator(req, res, wallet);
      case 'DELETE':
        return await deleteCreator(req, res, wallet);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    logger.error('Creator API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// GET /api/creators/[wallet] - Get specific creator by wallet
async function getCreator(req: VercelRequest, res: VercelResponse, wallet: string) {
  try {
    const creator = await Creator.findByWallet(wallet)
      .populate('uploadedVideos', 'title description views price createdAt thumbnail category');
    
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    // Calculate additional stats
    const stats = {
      totalVideos: creator.uploadedVideos.length,
      totalViews: creator.totalViews,
      totalEarnings: creator.total_earned_usdc,
      joinedAt: creator.joined_at,
      isVerified: creator.isVerified
    };
    
    return res.status(200).json({ 
      creator: {
        ...creator.toObject(),
        stats
      }
    });
    
  } catch (error) {
    logger.error('Error fetching creator:', error);
    return res.status(500).json({ error: 'Failed to fetch creator' });
  }
}

// PUT /api/creators/[wallet] - Update specific creator
async function updateCreator(req: VercelRequest, res: VercelResponse, wallet: string) {
  try {
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData.wallet_address;
    delete updateData.total_earned_usdc;
    delete updateData.joined_at;
    delete updateData.uploadedVideos;
    delete updateData._id;
    
    const creator = await Creator.findOneAndUpdate(
      { wallet_address: wallet.toLowerCase() },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    logger.log(`✅ Creator updated: ${creator.username} (${creator.wallet_address})`);
    
    return res.status(200).json({ 
      message: 'Creator updated successfully',
      creator 
    });
    
  } catch (error) {
    logger.error('Error updating creator:', error);
    
    if (error instanceof Error && error.message.includes('validation')) {
      return res.status(400).json({ error: 'Validation error', details: error.message });
    }
    
    return res.status(500).json({ error: 'Failed to update creator' });
  }
}

// DELETE /api/creators/[wallet] - Soft delete creator
async function deleteCreator(req: VercelRequest, res: VercelResponse, wallet: string) {
  try {
    const creator = await Creator.findOneAndUpdate(
      { wallet_address: wallet.toLowerCase() },
      { $set: { isActive: false } },
      { new: true }
    );
    
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    logger.log(`✅ Creator deactivated: ${creator.username} (${creator.wallet_address})`);
    
    return res.status(200).json({ 
      message: 'Creator deactivated successfully' 
    });
    
  } catch (error) {
    logger.error('Error deactivating creator:', error);
    return res.status(500).json({ error: 'Failed to deactivate creator' });
  }
}