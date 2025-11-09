import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectDB from '../../src/lib/database';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { slug } = req.query;
    const [videoId, action] = Array.isArray(slug) ? slug : [slug];
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const mongoose = await connectDB();
    const db = mongoose.connection.db;

    switch (req.method) {
      case 'GET':
        // Handle different GET actions
        switch (action) {
          case 'deduct-credit':
            return await deductCredit(db, videoId, req, res);
          default:
            return await getVideoDetails(db, videoId, res);
        }

      case 'POST':
        // Handle different POST actions
        switch (action) {
          case 'tip':
            return await processTip(db, videoId, req, res);
          case 'delete':
            return await deleteVideo(db, videoId, req, res);
          case 'upload':
            return await uploadVideo(db, videoId, req, res);
          default:
            return res.status(400).json({ error: 'Invalid action' });
        }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Video API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getVideoDetails(db: any, videoId: string, res: VercelResponse) {
  try {
    const video = await db.collection('videos').findOne({ 
      _id: new ObjectId(videoId) 
    });
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    return res.status(200).json(video);
  } catch (error) {
    console.error('Get video details error:', error);
    return res.status(500).json({ error: 'Failed to fetch video details' });
  }
}

async function deductCredit(db: any, videoId: string, req: VercelRequest, res: VercelResponse) {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const video = await db.collection('videos').findOne({ 
      _id: new ObjectId(videoId) 
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const user = await db.collection('users').findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.credits < 1) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Deduct credit
    await db.collection('users').updateOne(
      { walletAddress: walletAddress.toLowerCase() },
      { $inc: { credits: -1 } }
    );

    // Record unlock
    await db.collection('unlocks').insertOne({
      userId: user._id,
      videoId: new ObjectId(videoId),
      unlockedAt: new Date()
    });

    return res.status(200).json({ success: true, remainingCredits: user.credits - 1 });
  } catch (error) {
    console.error('Deduct credit error:', error);
    return res.status(500).json({ error: 'Failed to deduct credit' });
  }
}

async function processTip(db: any, videoId: string, req: VercelRequest, res: VercelResponse) {
  try {
    const { fromWallet, amount } = req.body;
    
    if (!fromWallet || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid tip parameters' });
    }

    const video = await db.collection('videos').findOne({ 
      _id: new ObjectId(videoId) 
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const tipper = await db.collection('users').findOne({ 
      walletAddress: fromWallet.toLowerCase() 
    });

    if (!tipper || tipper.credits < amount) {
      return res.status(400).json({ error: 'Insufficient credits for tip' });
    }

    // Fixed tip amount of 0.1 USDC
    const tipAmount = 0.1;

    // Deduct from tipper
    await db.collection('users').updateOne(
      { walletAddress: fromWallet.toLowerCase() },
      { $inc: { credits: -tipAmount } }
    );

    // Add to creator
    await db.collection('users').updateOne(
      { walletAddress: video.creatorWallet.toLowerCase() },
      { $inc: { tipBalance: tipAmount, totalTipsReceived: tipAmount } }
    );

    // Record tip
    await db.collection('tips').insertOne({
      videoId: new ObjectId(videoId),
      fromWallet: fromWallet.toLowerCase(),
      toWallet: video.creatorWallet.toLowerCase(),
      amount: tipAmount,
      createdAt: new Date()
    });

    return res.status(200).json({ success: true, tipAmount });
  } catch (error) {
    console.error('Process tip error:', error);
    return res.status(500).json({ error: 'Failed to process tip' });
  }
}

async function deleteVideo(db: any, videoId: string, req: VercelRequest, res: VercelResponse) {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const video = await db.collection('videos').findOne({ 
      _id: new ObjectId(videoId) 
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.creatorWallet.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(403).json({ error: 'Not authorized to delete this video' });
    }

    await db.collection('videos').deleteOne({ 
      _id: new ObjectId(videoId) 
    });

    return res.status(200).json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    return res.status(500).json({ error: 'Failed to delete video' });
  }
}

async function uploadVideo(db: any, videoId: string, req: VercelRequest, res: VercelResponse) {
  try {
    const { title, description, topic, price, creatorWallet, videoUrl, thumbnailUrl } = req.body;
    
    if (!title || !creatorWallet || !videoUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const videoData = {
      title,
      description: description || '',
      topic: topic || 'General',
      price: price || 1,
      creatorWallet: creatorWallet.toLowerCase(),
      videoUrl,
      thumbnailUrl: thumbnailUrl || '/placeholder.svg',
      views: 0,
      playCount: 0,
      tipsReceived: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (videoId === 'new') {
      // Create new video
      const result = await db.collection('videos').insertOne(videoData);
      return res.status(201).json({ 
        success: true, 
        videoId: result.insertedId,
        video: videoData 
      });
    } else {
      // Update existing video
      const result = await db.collection('videos').updateOne(
        { _id: new ObjectId(videoId) },
        { $set: videoData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Video not found' });
      }

      return res.status(200).json({ 
        success: true, 
        videoId: videoId,
        video: videoData 
      });
    }
  } catch (error) {
    console.error('Upload video error:', error);
    return res.status(500).json({ error: 'Failed to upload video' });
  }
}