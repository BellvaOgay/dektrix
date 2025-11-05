/**
 * Utility to scan and manage local video files
 * This system automatically detects videos in the public/videos folder
 */

export interface LocalVideoFile {
  filename: string;
  title: string;
  category: string;
  duration: number;
  description: string;
}

/**
 * Scans for local video files and generates metadata
 * This function simulates scanning a directory - in a real implementation,
 * this would be done server-side or through an API endpoint
 */
export function scanLocalVideos(): LocalVideoFile[] {
  // In a real implementation, this would scan the actual directory
  // For now, we'll maintain a list of known video files
  const knownVideos: LocalVideoFile[] = [
    { filename: 'Ep1.mp4', title: 'Episode 1', category: 'Entertainment', duration: 25, description: 'First episode of the series' },
    { filename: 'Eps2.mp4', title: 'Episode 2', category: 'Entertainment', duration: 30, description: 'Second episode of the series' },
    { filename: 'Vid3.mp4', title: 'Educational Video 3', category: 'Education', duration: 18, description: 'Educational content video 3' },
    { filename: 'Vid4.mp4', title: 'Educational Video 4', category: 'Education', duration: 22, description: 'Educational content video 4' },
    { filename: 'TestVideo.mp4', title: 'Test Video', category: 'General', duration: 15, description: 'Test video for demonstration' }
  ];

  return knownVideos;
}

/**
 * Generates video metadata from a filename
 * This creates intelligent titles and categories based on filename patterns
 */
export function generateVideoMetadata(filename: string): LocalVideoFile {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  
  // Generate title from filename
  let title = nameWithoutExt
    .replace(/[-_]/g, " ") // Replace dashes and underscores with spaces
    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words

  // Determine category based on filename patterns
  let category = "General";
  let duration = 20; // Default duration
  let description = `Video: ${title}`;

  if (filename.toLowerCase().includes("ep") || filename.toLowerCase().includes("episode")) {
    category = "Entertainment";
    duration = 25;
    description = `Episode: ${title}`;
  } else if (filename.toLowerCase().includes("edu") || filename.toLowerCase().includes("vid")) {
    category = "Education";
    duration = 15;
    description = `Educational video: ${title}`;
  } else if (filename.toLowerCase().includes("tutorial") || filename.toLowerCase().includes("guide")) {
    category = "Tutorial";
    duration = 30;
    description = `Tutorial: ${title}`;
  }

  return {
    filename,
    title,
    category,
    duration,
    description
  };
}

/**
 * Checks if a video file exists by trying to load it
 * This is a client-side check that attempts to load the video metadata
 */
export async function checkVideoExists(videoPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve(true);
    };
    
    video.onerror = () => {
      resolve(false);
    };
    
    video.src = videoPath;
  });
}

/**
 * Gets the actual duration of a video file
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve(Math.floor(video.duration) || 20); // Default to 20 seconds if duration is invalid
    };
    
    video.onerror = () => {
      resolve(20); // Default duration on error
    };
    
    video.src = videoPath;
  });
}

/**
 * Dynamically discovers available videos
 * This function can be extended to actually scan directories in a server environment
 */
export async function discoverLocalVideos(): Promise<LocalVideoFile[]> {
  const baseVideos = scanLocalVideos();
  
  // In a real implementation, you might want to:
  // 1. Check which files actually exist
  // 2. Get real video durations
  // 3. Generate thumbnails
  
  const discoveredVideos: LocalVideoFile[] = [];
  
  for (const video of baseVideos) {
    const videoPath = `/videos/${video.filename}`;
    
    // Check if video exists (optional - can be disabled for performance)
    // const exists = await checkVideoExists(videoPath);
    // if (exists) {
    //   const duration = await getVideoDuration(videoPath);
    //   discoveredVideos.push({ ...video, duration });
    // }
    
    // For now, assume all videos exist
    discoveredVideos.push(video);
  }
  
  return discoveredVideos;
}