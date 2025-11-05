import { connectDB } from '../_lib/database';
import User from '../../src/models/User';
import Video from '../../src/models/Video';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoId, walletAddress } = req.body;

  if (!videoId || !walletAddress) {
    return res.status(400).json({ error: 'Missing required fields: videoId, walletAddress' });
  }

  try {
    await connectDB();

    // Find the video
    const video = await Video.findById(videoId).populate('creator');
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Verify the user is the creator
    if ((video.creator as any).walletAddress !== walletAddress.toLowerCase()) {
      return res.status(403).json({ error: 'You can only delete your own videos' });
    }

    // Remove video from user's uploaded videos
    const user = await User.findById(video.creator._id);
    if (user) {
      user.userContainer.uploadedVideos = user.userContainer.uploadedVideos.filter(
        (videoId: any) => videoId.toString() !== (video._id as any).toString()
      );
      await user.save();
    }

    // Delete video files (optional - you might want to keep them)
    try {
      if (video.videoUrl) {
        const videoPath = path.join(process.cwd(), 'public', video.videoUrl);
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }
      }
      if (video.thumbnail && !video.thumbnail.includes('default.jpg')) {
        const thumbnailPath = path.join(process.cwd(), 'public', video.thumbnail);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }
    } catch (fileError) {
      console.warn('Error deleting video files:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete the video document
    await Video.findByIdAndDelete(videoId);

    return res.status(200).json({
      success: true,
      message: 'Video deleted successfully',
      data: {
        videoId,
        title: video.title,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error deleting video:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}