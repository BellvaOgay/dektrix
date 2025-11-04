import fs from 'fs';
import path from 'path';

export function videoMiddleware() {
  return {
    name: 'video-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Only handle video requests
        if (!req.url.startsWith('/videos/') || !req.url.endsWith('.mp4')) {
          return next();
        }
        
        const videoPath = path.join(process.cwd(), 'public', req.url);
        
        console.log(`[Video Middleware] Handling request: ${req.url}`);
        console.log(`[Video Middleware] File path: ${videoPath}`);
        
        // Check if file exists
        if (!fs.existsSync(videoPath)) {
          console.log(`[Video Middleware] File not found: ${videoPath}`);
          return next();
        }
        
        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;
        
        console.log(`[Video Middleware] File size: ${fileSize}, Range: ${range}`);
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range');
        
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
          
          console.log(`[Video Middleware] Range request: ${start}-${end}/${fileSize}`);
          
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
          });
          
          const file = fs.createReadStream(videoPath, { start, end });
          
          file.on('error', (err) => {
            console.error(`[Video Middleware] Stream error:`, err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end();
            }
          });
          
          file.pipe(res);
        } else {
          // Handle full file requests
          console.log(`[Video Middleware] Full file request`);
          
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'bytes',
          });
          
          const file = fs.createReadStream(videoPath);
          
          file.on('error', (err) => {
            console.error(`[Video Middleware] Stream error:`, err);
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