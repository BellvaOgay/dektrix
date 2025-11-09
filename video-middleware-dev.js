import fs from 'fs';
import path from 'path';

// Development version without database dependency
export function enhancedVideoMiddleware() {
  return {
    name: 'enhanced-video-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Only handle video requests
        if (!req.url.startsWith('/videos/') || !req.url.endsWith('.mp4')) {
          return next();
        }
        
        const videoPath = path.join(process.cwd(), 'public', req.url);
        
        console.log(`[Enhanced Video Middleware] Handling request: ${req.url}`);
        console.log(`[Enhanced Video Middleware] File path: ${videoPath}`);
        
        // Check if file exists
        if (!fs.existsSync(videoPath)) {
          console.log(`[Enhanced Video Middleware] File not found: ${videoPath}`);
          return next();
        }

        // Extract authentication from request (development mode)
        const walletAddress = req.headers['x-wallet-address'] || 
                             new URL(req.url, 'http://localhost').searchParams.get('wallet');
        const userId = req.headers['x-user-id'] || 
                      new URL(req.url, 'http://localhost').searchParams.get('userId');

        // Development mode: Allow access without authentication for testing
        if (!walletAddress && !userId) {
          console.log(`[Enhanced Video Middleware] Development mode: Allowing access without authentication for testing`);
          // Continue to serve the video file without authentication in development
        }

        // In development, simulate access control
        console.log(`[Enhanced Video Middleware] Access granted for development (wallet: ${walletAddress}, user: ${userId})`);
        
        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;
        
        console.log(`[Enhanced Video Middleware] File size: ${fileSize}, Range: ${range}`);
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range, X-Wallet-Address, X-User-Id');
        
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }
        
        if (req.method === 'HEAD') {
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'bytes',
          });
          res.end();
          return;
        }
        
        if (range) {
          // Handle range requests for video streaming
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunksize = (end - start) + 1;
          
          console.log(`[Enhanced Video Middleware] Range request: ${start}-${end}/${fileSize}`);
          
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
          });
          
          const file = fs.createReadStream(videoPath, { start, end });
          
          file.on('error', (err) => {
            console.error(`[Enhanced Video Middleware] Stream error:`, err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end();
            }
          });
          
          file.pipe(res);
        } else {
          // Handle full file requests
          console.log(`[Enhanced Video Middleware] Full file request`);
          
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'bytes',
          });
          
          const file = fs.createReadStream(videoPath);
          
          file.on('error', (err) => {
            console.error(`[Enhanced Video Middleware] Stream error:`, err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end();
            }
          });
          
          file.pipe(res);
        }
      });
    }
  };
}