import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

function send(res: ServerResponse, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function getContentType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.mov') return 'video/quicktime';
  return 'application/octet-stream';
}

export default async function handler(
  req: IncomingMessage & { method?: string; url?: string },
  res: ServerResponse
) {
  try {
    const method = (req.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return send(res, 405, { success: false, error: 'Method Not Allowed' });
    }

    // Extract filename from URL path
    const url = new URL(req.url || '', 'http://localhost');
    const parts = url.pathname.split('/');
    const rawFilename = parts[parts.length - 1] || '';

    // Decode and sanitize
    const decoded = decodeURIComponent(rawFilename);
    const safeFilename = path.basename(decoded); // prevent path traversal

    // Only allow mp4/mov files
    const allowed = ['.mp4', '.mov'];
    const ext = path.extname(safeFilename).toLowerCase();
    if (!allowed.includes(ext)) {
      return send(res, 400, { success: false, error: 'Unsupported file type' });
    }

    const videoPath = path.join(process.cwd(), 'private_videos', safeFilename);

    if (!fs.existsSync(videoPath)) {
      return send(res, 404, { success: false, error: 'File not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = getContentType(safeFilename);

    // Handle HEAD requests by returning headers only
    if (method === 'HEAD') {
      res.statusCode = 200;
      res.setHeader('Content-Length', String(fileSize));
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      return res.end();
    }

    try {
      if (range) {
        // Parse Range: e.g., bytes=0-1023
        const match = /bytes=(\d*)-(\d*)/.exec(range);
        if (!match) {
          res.statusCode = 416; // Range Not Satisfiable
          res.setHeader('Content-Range', `bytes */${fileSize}`);
          return res.end();
        }
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize || start > end) {
          res.statusCode = 416;
          res.setHeader('Content-Range', `bytes */${fileSize}`);
          return res.end();
        }

        const chunkSize = end - start + 1;
        res.statusCode = 206; // Partial Content
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', String(chunkSize));
        res.setHeader('Content-Type', contentType);

        const stream = fs.createReadStream(videoPath, { start, end });
        stream.on('open', () => stream.pipe(res));
        stream.on('error', (err) => {
          console.error('Stream error:', err);
          try { res.destroy(err as any); } catch { /* noop */ }
        });
      } else {
        // Full file
        res.statusCode = 200;
        res.setHeader('Content-Length', String(fileSize));
        res.setHeader('Content-Type', contentType);
        res.setHeader('Accept-Ranges', 'bytes');

        const stream = fs.createReadStream(videoPath);
        stream.on('open', () => stream.pipe(res));
        stream.on('error', (err) => {
          console.error('Stream error:', err);
          try { res.destroy(err as any); } catch { /* noop */ }
        });
      }
    } catch (err) {
      console.error('Streaming error:', err);
      return send(res, 500, { success: false, error: 'Failed to stream video' });
    }
  } catch (error) {
    console.error('Handler error:', error);
    return send(res, 500, { success: false, error: 'Internal Server Error' });
  }
}