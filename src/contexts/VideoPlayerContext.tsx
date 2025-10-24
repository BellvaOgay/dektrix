import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

interface VideoPlayerContextType {
  currentPlayingVideo: string | null;
  setCurrentPlayingVideo: (videoId: string | null) => void;
  pauseAllVideos: () => void;
  registerVideo: (videoId: string, videoElement: HTMLVideoElement) => void;
  unregisterVideo: (videoId: string) => void;
  incrementVideoView: (videoId: string) => Promise<void>;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(undefined);

interface VideoPlayerProviderProps {
  children: ReactNode;
}

export const VideoPlayerProvider: React.FC<VideoPlayerProviderProps> = ({ children }) => {
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<string | null>(null);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const viewedVideosRef = useRef<Set<string>>(new Set());

  const pauseAllVideos = () => {
    videoElementsRef.current.forEach((videoElement) => {
      if (!videoElement.paused) {
        videoElement.pause();
      }
    });
    setCurrentPlayingVideo(null);
  };

  const registerVideo = (videoId: string, videoElement: HTMLVideoElement) => {
    videoElementsRef.current.set(videoId, videoElement);
  };

  const unregisterVideo = (videoId: string) => {
    videoElementsRef.current.delete(videoId);
    if (currentPlayingVideo === videoId) {
      setCurrentPlayingVideo(null);
    }
  };

  const incrementVideoView = async (videoId: string) => {
    // Only count each video view once per session
    if (viewedVideosRef.current.has(videoId)) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/videos/${videoId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        viewedVideosRef.current.add(videoId);
        console.log(`✅ View count incremented for video: ${videoId}`);
      } else {
        console.error('Failed to increment view count:', await response.text());
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleSetCurrentPlayingVideo = (videoId: string | null) => {
    if (videoId && videoId !== currentPlayingVideo) {
      // Pause all other videos when a new one starts playing
      videoElementsRef.current.forEach((videoElement, id) => {
        if (id !== videoId && !videoElement.paused) {
          videoElement.pause();
        }
      });
      
      // Increment view count when video starts playing
      incrementVideoView(videoId);
    }
    setCurrentPlayingVideo(videoId);
  };

  const value: VideoPlayerContextType = {
    currentPlayingVideo,
    setCurrentPlayingVideo: handleSetCurrentPlayingVideo,
    pauseAllVideos,
    registerVideo,
    unregisterVideo,
    incrementVideoView,
  };

  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
};

export const useVideoPlayer = (): VideoPlayerContextType => {
  const context = useContext(VideoPlayerContext);
  if (context === undefined) {
    throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
  }
  return context;
};