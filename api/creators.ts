import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectDB from '../src/lib/database';
import Creator, { ICreator } from '../src/models/Creator';
import { logger } from '../src/lib/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();
    
    const { method } = req;
    
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
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

// GET /api/creators - Get all creators or specific creator
async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    const { wallet_address, username, top_earners, limit = '10' } = req.query;
    
    // Get top earners
    if (top_earners === 'true') {
      const creators = await Creator.getTopEarners(parseInt(limit as string));
      return res.status(200).json({ creators });
    }
    
    // Get specific creator by wallet address
    if (wallet_address) {
      const creator = await Creator.findByWallet(wallet_address as string)
        .populate('uploadedVideos', 'title views createdAt');
      
      if (!creator) {
        return res.status(404).json({ error: 'Creator not found' });
      }
      
      return res.status(200).json({ creator });
    }
    
    // Get specific creator by username
    if (username) {
      const creator = await Creator.findOne({ username: username as string })
        .populate('uploadedVideos', 'title views createdAt');
      
      if (!creator) {
        return res.status(404).json({ error: 'Creator not found' });
      }
      
      return res.status(200).json({ creator });
    }
    
    // Get all creators with pagination
    const page = parseInt(req.query.page as string) || 1;
    const limitNum = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limitNum;
    
    const creators = await Creator.find({ isActive: true })
      .sort({ total_earned_usdc: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('wallet_address username bio profile_image_url total_earned_usdc joined_at isVerified totalViews followerCount');
    
    const total = await Creator.countDocuments({ isActive: true });
    
    return res.status(200).json({
      creators,
      pagination: {
        page,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error) {
    logger.error('Error fetching creators:', error);
    return res.status(500).json({ error: 'Failed to fetch creators' });
  }
}

// POST /api/creators - Create new creator
async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      wallet_address,
      username,
      bio,
      profile_image_url,
      socialLinks
    } = req.body;
    
    // Validate required fields
    if (!wallet_address || !username) {
      return res.status(400).json({ 
        error: 'Missing required fields: wallet_address and username are required' 
      });
    }
    
    // Check if creator already exists
    const existingCreator = await Creator.findOne({
      $or: [
        { wallet_address: wallet_address.toLowerCase() },
        { username: username }
      ]
    });
    
    if (existingCreator) {
      return res.status(409).json({ 
        error: 'Creator already exists with this wallet address or username' 
      });
    }
    
    // Create new creator
    const creator = new Creator({
      wallet_address: wallet_address.toLowerCase(),
      username,
      bio,
      profile_image_url,
      socialLinks,
      joined_at: new Date(),
      total_earned_usdc: 0
    });
    
    await creator.save();
    
    logger.log(`✅ New creator created: ${username} (${wallet_address})`);
    
    return res.status(201).json({ 
      message: 'Creator created successfully',
      creator: {
        id: creator._id,
        wallet_address: creator.wallet_address,
        username: creator.username,
        bio: creator.bio,
        profile_image_url: creator.profile_image_url,
        total_earned_usdc: creator.total_earned_usdc,
        joined_at: creator.joined_at
      }
    });
    
  } catch (error) {
    logger.error('Error creating creator:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(409).json({ error: 'Creator with this wallet address or username already exists' });
    }
    
    return res.status(500).json({ error: 'Failed to create creator' });
  }
}

// PUT /api/creators - Update creator
async function handlePut(req: VercelRequest, res: VercelResponse) {
  try {
    const { wallet_address } = req.query;
    const updateData = req.body;
    
    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address is required' });
    }
    
    // Remove fields that shouldn't be updated directly
    delete updateData.wallet_address;
    delete updateData.total_earned_usdc;
    delete updateData.joined_at;
    delete updateData.uploadedVideos;
    delete updateData._id;
    
    const creator = await Creator.findOneAndUpdate(
      { wallet_address: (wallet_address as string).toLowerCase() },
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
    return res.status(500).json({ error: 'Failed to update creator' });
  }
}

// DELETE /api/creators - Soft delete creator (set isActive to false)
async function handleDelete(req: VercelRequest, res: VercelResponse) {
  try {
    const { wallet_address } = req.query;
    
    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address is required' });
    }
    
    const creator = await Creator.findOneAndUpdate(
      { wallet_address: (wallet_address as string).toLowerCase() },
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