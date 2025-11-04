import { useCallback, useEffect, useState } from 'react';

interface UsePortraitFullscreenReturn {
  isPortraitFullscreen: boolean;
  enterPortraitFullscreen: (videoElement: HTMLVideoElement) => void;
  exitPortraitFullscreen: () => void;
  togglePortraitFullscreen: (videoElement: HTMLVideoElement) => void;
}

export const usePortraitFullscreen = (): UsePortraitFullscreenReturn => {
  const [isPortraitFullscreen, setIsPortraitFullscreen] = useState(false);
  const [fullscreenContainer, setFullscreenContainer] = useState<HTMLDivElement | null>(null);

  // Check if video is portrait (height > width)
  const isPortraitVideo = (videoElement: HTMLVideoElement): boolean => {
    return videoElement.videoHeight > videoElement.videoWidth;
  };

  const enterPortraitFullscreen = useCallback((videoElement: HTMLVideoElement) => {
    if (!videoElement || isPortraitFullscreen) return;

    // Check if it's a portrait video
    if (!isPortraitVideo(videoElement)) {
      // For landscape videos, use native fullscreen
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      }
      return;
    }

    // Create custom fullscreen container for portrait videos
    const container = document.createElement('div');
    container.className = 'portrait-fullscreen-container';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-label', 'Video fullscreen player');
    
    // Create exit button
    const exitButton = document.createElement('button');
    exitButton.className = 'fullscreen-exit-btn';
    exitButton.innerHTML = '×';
    exitButton.setAttribute('aria-label', 'Exit fullscreen');
    exitButton.setAttribute('title', 'Exit fullscreen (Esc)');
    exitButton.onclick = () => exitPortraitFullscreen();
    
    // Add touch support for mobile
    exitButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      exitPortraitFullscreen();
    });
    
    // Create custom controls
    const controls = document.createElement('div');
    controls.className = 'custom-video-controls';
    controls.setAttribute('role', 'toolbar');
    controls.setAttribute('aria-label', 'Video controls');
    
    // Play/Pause button
    const playPauseBtn = document.createElement('button');
    playPauseBtn.innerHTML = videoElement.paused ? '▶' : '⏸';
    playPauseBtn.setAttribute('aria-label', videoElement.paused ? 'Play' : 'Pause');
    playPauseBtn.setAttribute('title', videoElement.paused ? 'Play (Space)' : 'Pause (Space)');
    playPauseBtn.onclick = () => {
      if (videoElement.paused) {
        videoElement.play();
        playPauseBtn.innerHTML = '⏸';
        playPauseBtn.setAttribute('aria-label', 'Pause');
        playPauseBtn.setAttribute('title', 'Pause (Space)');
      } else {
        videoElement.pause();
        playPauseBtn.innerHTML = '▶';
        playPauseBtn.setAttribute('aria-label', 'Play');
        playPauseBtn.setAttribute('title', 'Play (Space)');
      }
    };
    
    // Volume button
    const volumeBtn = document.createElement('button');
    volumeBtn.innerHTML = videoElement.muted ? '🔇' : '🔊';
    volumeBtn.setAttribute('aria-label', videoElement.muted ? 'Unmute' : 'Mute');
    volumeBtn.setAttribute('title', videoElement.muted ? 'Unmute' : 'Mute');
    volumeBtn.onclick = () => {
      videoElement.muted = !videoElement.muted;
      volumeBtn.innerHTML = videoElement.muted ? '🔇' : '🔊';
      volumeBtn.setAttribute('aria-label', videoElement.muted ? 'Unmute' : 'Mute');
      volumeBtn.setAttribute('title', videoElement.muted ? 'Unmute' : 'Mute');
    };
    
    controls.appendChild(playPauseBtn);
    controls.appendChild(volumeBtn);
    
    // Clone the video element to avoid disrupting the original
    const clonedVideo = videoElement.cloneNode(true) as HTMLVideoElement;
    clonedVideo.controls = false; // Hide default controls
    clonedVideo.currentTime = videoElement.currentTime;
    clonedVideo.volume = videoElement.volume;
    clonedVideo.muted = videoElement.muted;
    clonedVideo.setAttribute('aria-label', 'Fullscreen video player');
    
    // Sync playback state
    if (!videoElement.paused) {
      clonedVideo.play();
    }
    
    // Add touch support for video (tap to play/pause)
    let tapTimeout: NodeJS.Timeout;
    clonedVideo.addEventListener('touchstart', (e) => {
      e.preventDefault();
      
      // Clear any existing timeout
      if (tapTimeout) {
        clearTimeout(tapTimeout);
      }
      
      // Set a timeout to distinguish between tap and hold
      tapTimeout = setTimeout(() => {
        playPauseBtn.click();
      }, 200);
    });
    
    clonedVideo.addEventListener('touchend', (e) => {
      e.preventDefault();
    });
    
    // Add elements to container
    container.appendChild(clonedVideo);
    container.appendChild(exitButton);
    container.appendChild(controls);
    
    // Add to document body
    document.body.appendChild(container);
    
    // Pause original video
    videoElement.pause();
    
    // Set state
    setIsPortraitFullscreen(true);
    setFullscreenContainer(container);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus the container for keyboard navigation
    container.focus();
    container.setAttribute('tabindex', '-1');
    
    // Handle keyboard events
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitPortraitFullscreen();
      } else if (e.key === ' ') {
        e.preventDefault();
        playPauseBtn.click();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        volumeBtn.click();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    container.setAttribute('data-keyboard-handler', 'true');
    
    // Update play/pause button when video state changes
    const updatePlayButton = () => {
      playPauseBtn.innerHTML = clonedVideo.paused ? '▶' : '⏸';
      playPauseBtn.setAttribute('aria-label', clonedVideo.paused ? 'Play' : 'Pause');
      playPauseBtn.setAttribute('title', clonedVideo.paused ? 'Play (Space)' : 'Pause (Space)');
    };
    
    clonedVideo.addEventListener('play', updatePlayButton);
    clonedVideo.addEventListener('pause', updatePlayButton);
    
    // Sync back to original video when exiting
    const syncBackToOriginal = () => {
      videoElement.currentTime = clonedVideo.currentTime;
      videoElement.volume = clonedVideo.volume;
      videoElement.muted = clonedVideo.muted;
    };
    
    container.setAttribute('data-sync-handler', 'sync');
    (container as any).syncBackToOriginal = syncBackToOriginal;
    
  }, [isPortraitFullscreen]);

  const exitPortraitFullscreen = useCallback(() => {
    if (!isPortraitFullscreen || !fullscreenContainer) return;
    
    // Sync back to original video if sync handler exists
    if ((fullscreenContainer as any).syncBackToOriginal) {
      (fullscreenContainer as any).syncBackToOriginal();
    }
    
    // Remove keyboard event listener
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitPortraitFullscreen();
      }
    };
    document.removeEventListener('keydown', handleKeyPress);
    
    // Remove container
    document.body.removeChild(fullscreenContainer);
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Reset state
    setIsPortraitFullscreen(false);
    setFullscreenContainer(null);
  }, [isPortraitFullscreen, fullscreenContainer]);

  const togglePortraitFullscreen = useCallback((videoElement: HTMLVideoElement) => {
    if (isPortraitFullscreen) {
      exitPortraitFullscreen();
    } else {
      enterPortraitFullscreen(videoElement);
    }
  }, [isPortraitFullscreen, enterPortraitFullscreen, exitPortraitFullscreen]);

  // Handle escape key globally
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPortraitFullscreen) {
        exitPortraitFullscreen();
      }
    };

    if (isPortraitFullscreen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isPortraitFullscreen, exitPortraitFullscreen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isPortraitFullscreen) {
        exitPortraitFullscreen();
      }
    };
  }, []);

  return {
    isPortraitFullscreen,
    enterPortraitFullscreen,
    exitPortraitFullscreen,
    togglePortraitFullscreen,
  };
};