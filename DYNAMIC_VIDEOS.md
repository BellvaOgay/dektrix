# Dynamic Video Discovery System

## Overview
Your Dektrix application now automatically discovers and displays videos from the `public/videos` folder without requiring manual code updates.

## How It Works

### 1. Automatic Video Scanning
- The system scans the `public/videos` directory for video files
- Supports common video formats (.mp4, .webm, .ogg, .mov, .avi)
- Automatically generates metadata from filenames

### 2. Smart Metadata Generation
The system intelligently generates video metadata:
- **Title**: Extracted from filename (removes extension and special characters)
- **Category**: Inferred from filename patterns (Education, Entertainment, Music, etc.)
- **Duration**: Estimated based on filename patterns or defaults to 20 minutes
- **Description**: Generated from title and category

### 3. Fallback System
If video scanning fails:
- Falls back to hardcoded list of known videos
- Ensures the app always has content to display
- Provides detailed error logging for debugging

## Adding New Videos

### Simple Method
1. Add your video file to `public/videos/`
2. Refresh the browser
3. The video automatically appears in the feed

### Example Filenames
- `Educational_Tutorial_2024.mp4` → Category: Education, Title: Educational Tutorial 2024
- `Entertainment_Show_Episode_1.mp4` → Category: Entertainment, Title: Entertainment Show Episode 1
- `Music_Video_Rock_Concert.mp4` → Category: Music, Title: Music Video Rock Concert

## Technical Implementation

### Key Files
- `src/utils/videoScanner.ts` - Core video discovery logic
- `src/api/videos.ts` - API integration with dynamic video loading
- `src/components/VideoFeed.tsx` - UI component with async video loading

### Features
- ✅ Automatic video discovery
- ✅ Smart metadata generation
- ✅ Error handling with fallbacks
- ✅ Async loading with loading states
- ✅ Console logging for debugging
- ✅ Support for multiple video formats

## Testing
The system includes:
- Console logs showing discovered videos
- Error handling with fallback content
- Build-time validation
- Development server hot-reloading

## Troubleshooting
If videos don't appear:
1. Check browser console for error messages
2. Verify video files are in `public/videos/`
3. Ensure video files have supported extensions
4. Check network tab for failed requests
5. Restart development server if needed

## Video Formats Supported
- MP4 (.mp4)
- WebM (.webm)
- OGG (.ogg)
- MOV (.mov)
- AVI (.avi)

The system is now ready to automatically display any videos you add to the `public/videos` folder!