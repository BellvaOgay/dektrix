import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import * as formidable from 'formidable';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

function send(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const { method } = req;
  const { pathname } = parse(req.url || '', true);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return send(res, 200, { success: true });
  }

  if (method !== 'POST') {
    return send(res, 405, { success: false, error: 'Method not allowed' });
  }

  try {
    // Create upload directories if they don't exist
    const publicVideosDir = path.join(process.cwd(), 'public', 'videos');
    const publicThumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    
    if (!fs.existsSync(publicVideosDir)) {
      fs.mkdirSync(publicVideosDir, { recursive: true });
    }
    
    if (!fs.existsSync(publicThumbnailsDir)) {
      fs.mkdirSync(publicThumbnailsDir, { recursive: true });
    }

    // Configure formidable
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'temp'),
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB max file size
      multiples: true,
    });

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Parse the form
    const [fields, files] = await form.parse(req);
    
    const uploadedFiles: { [key: string]: string } = {};

    // Process each uploaded file
    for (const [fieldName, fileArray] of Object.entries(files as Record<string, any[]>)) {
      if (!fileArray || (Array.isArray(fileArray) && fileArray.length === 0)) continue;
      
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
      if (!file || !file.filepath) continue;

      // Generate unique filename
      const fileExtension = path.extname(file.originalFilename || '');
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      
      let destinationDir: string;
      let urlPath: string;
      
      // Determine destination based on file type
      if (fieldName === 'video' || file.mimetype?.startsWith('video/')) {
        destinationDir = publicVideosDir;
        urlPath = `/videos/${uniqueFilename}`;
      } else if (fieldName === 'thumbnail' || file.mimetype?.startsWith('image/')) {
        destinationDir = publicThumbnailsDir;
        urlPath = `/thumbnails/${uniqueFilename}`;
      } else {
        // Default to videos directory
        destinationDir = publicVideosDir;
        urlPath = `/videos/${uniqueFilename}`;
      }
      
      const destinationPath = path.join(destinationDir, uniqueFilename);
      
      // Move file from temp to destination
      fs.renameSync(file.filepath, destinationPath);
      
      uploadedFiles[fieldName] = urlPath;
      
      console.log(`✅ File uploaded: ${fieldName} -> ${urlPath}`);
    }

    // Clean up temp directory
    try {
      const tempFiles = fs.readdirSync(tempDir);
      for (const tempFile of tempFiles) {
        const tempFilePath = path.join(tempDir, tempFile);
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (cleanupError) {
      console.warn('Temp cleanup warning:', cleanupError);
    }

    return send(res, 200, {
      success: true,
      data: {
        files: uploadedFiles,
        message: 'Files uploaded successfully'
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return send(res, 500, {
      success: false,
      error: 'File upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}