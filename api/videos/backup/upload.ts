import { connectDB } from '../_lib/database';
import User from '../../src/models/User';
import Video from '../../src/models/Video';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const form = new formidable.IncomingForm({
      uploadDir: path.join(process.cwd(), 'public', 'uploads', 'videos'),
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB max
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(400).json({ error: 'Error parsing form data' });
      }

      const { walletAddress, title, description, category, tags, difficulty, isFree } = fields;
      const videoFile = files.video;
      const thumbnailFile = files.thumbnail;

      // Handle form fields that can be strings or arrays
      const walletAddressStr = Array.isArray(walletAddress) ? walletAddress[0] : walletAddress;
      const titleStr = Array.isArray(title) ? title[0] : title;
      const descriptionStr = Array.isArray(description) ? description[0] : description;
      const categoryStr = Array.isArray(category) ? category[0] : category;
      const difficultyStr = Array.isArray(difficulty) ? difficulty[0] : difficulty;
      const isFreeStr = Array.isArray(isFree) ? isFree[0] : isFree;

      if (!walletAddressStr || !titleStr || !descriptionStr || !categoryStr || !videoFile) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      try {
        // Find the user
        const user = await User.findOne({ walletAddress: walletAddressStr.toLowerCase() });
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Process video file
        const videoFileArray = Array.isArray(videoFile) ? videoFile : [videoFile];
        const videoFilePath = videoFileArray[0].filepath;
        const videoFileName = path.basename(videoFilePath);
        const videoUrl = `/uploads/videos/${videoFileName}`;

        // Process thumbnail file (optional)
        let thumbnailUrl = '/uploads/thumbnails/default.jpg'; // Default thumbnail
        if (thumbnailFile) {
          const thumbnailFileArray = Array.isArray(thumbnailFile) ? thumbnailFile : [thumbnailFile];
          const thumbnailFilePath = thumbnailFileArray[0].filepath;
          const thumbnailFileName = path.basename(thumbnailFilePath);
          thumbnailUrl = `/uploads/thumbnails/${thumbnailFileName}`;
        }

        // Parse tags
        let tagsArray: string[] = [];
        if (tags) {
          if (Array.isArray(tags)) {
            // If tags is already an array, process each element
            tagsArray = tags.flatMap((tag: string | formidable.File) => {
              if (typeof tag === 'string') {
                return tag.split(',').map(t => t.trim());
              }
              return [];
            });
          } else if (typeof tags === 'string') {
            // If tags is a string, split by comma
            const tagsStr = tags as string;
            tagsArray = tagsStr.split(',').map((tag: string) => tag.trim());
          }
        }

        // Create video document
        const newVideo = new Video({
          title: titleStr,
          description: descriptionStr,
          thumbnail: thumbnailUrl,
          videoUrl: videoUrl,
          duration: 0, // Will be updated after processing
          category: categoryStr,
          tags: tagsArray,
          price: isFreeStr === 'true' ? 0 : 1000000, // 1 USDC in wei for premium videos
          priceDisplay: isFreeStr === 'true' ? 'Free' : '$1.00',
          tipAmount: 100000, // Fixed 0.1 USDC in wei
          tipAmountDisplay: '0.1 USDC',
          difficulty: difficultyStr || 'Beginner',
          creator: user._id,
          creatorWallet: user.walletAddress,
          isFree: isFreeStr === 'true',
          isActive: true,
          featured: false
        });

        await newVideo.save();

        // Add video to user's uploaded videos
        user.userContainer.uploadedVideos.push(newVideo._id as any);
        await user.save();

        return res.status(201).json({
          success: true,
          message: 'Video uploaded successfully',
          data: {
            video: {
              id: newVideo._id,
              title: newVideo.title,
              description: newVideo.description,
              thumbnail: newVideo.thumbnail,
              videoUrl: newVideo.videoUrl,
              category: newVideo.category,
              isFree: newVideo.isFree,
              createdAt: newVideo.createdAt
            }
          }
        });

      } catch (error) {
        console.error('Error processing upload:', error);
        return res.status(500).json({ error: 'Error processing upload' });
      }
    });

  } catch (error) {
    console.error('Error in upload handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}