import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';
import * as path from 'path';
import { checkVideoAccess } from '../_lib/video-access-control';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Extract filename from query parameters
    const { filename } = req.query;
    
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    
    // Validate file extension
    const allowedExtensions = ['.mp4', '.mov', '.MOV'];
    const fileExtension = path.extname(sanitizedFilename).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Construct file path
    const videoPath = path.join(process.cwd(), 'private-videos', sanitizedFilename);
    
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Extract authentication from request
    const walletAddress = req.headers['x-wallet-address'] as string ||
                         req.query.wallet as string;
    const userId = req.headers['x-user-id'] as string ||
                  req.query.userId as string;

    // Check video access
    const accessResult = await checkVideoAccess({
      userId,
      walletAddress,
      videoPath: `/private-videos/${sanitizedFilename}`
    });

    console.log(`[Private Videos API] Access check for ${sanitizedFilename}:`, accessResult);

    if (!accessResult.allowed) {
      return res.status(403).json({
        success: false,
        error: accessResult.reason,
        requiresAuth: accessResult.requiresAuth,
        creditsRequired: accessResult.creditsRequired,
        userCredits: accessResult.userCredits
      });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Set appropriate headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, X-Wallet-Address, X-User-Id');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', 'video/mp4');

    if (req.method === 'HEAD') {
      res.setHeader('Content-Length', fileSize);
      return res.status(200).end();
    }

    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      console.log(`[Private Videos API] Range request: ${start}-${end}/${fileSize}`);

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      });

      const file = fs.createReadStream(videoPath, { start, end });
      
      file.on('error', (err) => {
        console.error(`[Private Videos API] Stream error:`, err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end();
        }
      });

      file.pipe(res);
    } else {
      // Handle full file requests
      console.log(`[Private Videos API] Full file request`);

      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
      });

      const file = fs.createReadStream(videoPath);
      
      file.on('error', (err) => {
        console.error(`[Private Videos API] Stream error:`, err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end();
        }
      });

      file.pipe(res);
    }

  } catch (error) {
    console.error('[Private Videos API] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export const config = {
  api: {
    responseLimit: false,
    externalResolver: true,
  },
};