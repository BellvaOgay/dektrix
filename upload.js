"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const url_1 = require("url");
const formidable = __importStar(require("formidable"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
function send(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end(JSON.stringify(data));
}
async function handler(req, res) {
    const { method } = req;
    const { pathname } = (0, url_1.parse)(req.url || '', true);
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
        const uploadedFiles = {};
        // Process each uploaded file
        for (const [fieldName, fileArray] of Object.entries(files)) {
            if (!fileArray || (Array.isArray(fileArray) && fileArray.length === 0))
                continue;
            const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
            if (!file || !file.filepath)
                continue;
            // Generate unique filename
            const fileExtension = path.extname(file.originalFilename || '');
            const uniqueFilename = `${(0, uuid_1.v4)()}${fileExtension}`;
            let destinationDir;
            let urlPath;
            // Determine destination based on file type
            if (fieldName === 'video' || file.mimetype?.startsWith('video/')) {
                destinationDir = publicVideosDir;
                urlPath = `/videos/${uniqueFilename}`;
            }
            else if (fieldName === 'thumbnail' || file.mimetype?.startsWith('image/')) {
                destinationDir = publicThumbnailsDir;
                urlPath = `/thumbnails/${uniqueFilename}`;
            }
            else {
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
        }
        catch (cleanupError) {
            console.warn('Temp cleanup warning:', cleanupError);
        }
        return send(res, 200, {
            success: true,
            data: {
                files: uploadedFiles,
                message: 'Files uploaded successfully'
            }
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        return send(res, 500, {
            success: false,
            error: 'File upload failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
