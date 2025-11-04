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
    
    // Create custom fullscreen container (always use custom to maintain 9:16 framing)
    const container = document.createElement('div');
    container.className = 'portrait-fullscreen-container';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-label', 'Video fullscreen player');
    container.setAttribute('tabindex', '-1');
    
    // Try to enter real fullscreen and lock orientation to portrait
    // This may fail on some browsers; we gracefully continue with overlay CSS.
    (async () => {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
          if ((screen as any).orientation && typeof (screen as any).orientation.lock === 'function') {
            try {
              await (screen as any).orientation.lock('portrait');
            } catch {}
          }
        }
      } catch {}
    })();
    
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

    // Ensure vertical playback framing and avoid horizontal stretching
    clonedVideo.style.maxHeight = '100vh';
    clonedVideo.style.maxWidth = '100vw';
    clonedVideo.style.width = 'auto';
    clonedVideo.style.height = 'auto';
    clonedVideo.style.objectFit = 'contain';
    clonedVideo.style.transformOrigin = 'center center';
    clonedVideo.style.willChange = 'transform';

    // Apply rotation for landscape videos to keep playback vertical
    const applyOrientationTransform = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = clonedVideo.videoWidth;
      const h = clonedVideo.videoHeight;

      if (!w || !h) return; // metadata not ready

      // If landscape, rotate 90deg and scale to fit within viewport
      if (w > h) {
        // After rotation, width -> h, height -> w
        const scale = Math.min(vw / h, vh / w);
        clonedVideo.style.transform = `rotate(90deg) scale(${scale})`;
      } else {
        // Portrait, no rotation; ensure it fits using object-fit
        clonedVideo.style.transform = 'none';
      }
    };

    // Recompute transform on resize
    const handleResize = () => applyOrientationTransform();
    window.addEventListener('resize', handleResize);
    (container as any).portraitResizeHandler = handleResize;

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

    // Apply transform once metadata is available
    if (clonedVideo.readyState >= 1) {
      applyOrientationTransform();
    } else {
      clonedVideo.addEventListener('loadedmetadata', applyOrientationTransform, { once: true });
    }
    
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

    // Remove resize handler if attached
    if ((fullscreenContainer as any).portraitResizeHandler) {
      window.removeEventListener('resize', (fullscreenContainer as any).portraitResizeHandler);
    }
    
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