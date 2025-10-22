import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

interface VideoPlayerContextType {
  currentPlayingVideo: string | null;
  setCurrentPlayingVideo: (videoId: string | null) => void;
  pauseAllVideos: () => void;
  registerVideo: (videoId: string, videoElement: HTMLVideoElement) => void;
  unregisterVideo: (videoId: string) => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(undefined);

interface VideoPlayerProviderProps {
  children: ReactNode;
}

export const VideoPlayerProvider: React.FC<VideoPlayerProviderProps> = ({ children }) => {
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<string | null>(null);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());

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

  const handleSetCurrentPlayingVideo = (videoId: string | null) => {
    if (videoId && videoId !== currentPlayingVideo) {
      // Pause all other videos when a new one starts playing
      videoElementsRef.current.forEach((videoElement, id) => {
        if (id !== videoId && !videoElement.paused) {
          videoElement.pause();
        }
      });
    }
    setCurrentPlayingVideo(videoId);
  };

  const value: VideoPlayerContextType = {
    currentPlayingVideo,
    setCurrentPlayingVideo: handleSetCurrentPlayingVideo,
    pauseAllVideos,
    registerVideo,
    unregisterVideo,
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