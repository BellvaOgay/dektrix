import { useState, useRef, useEffect } from "react";
import { Play, Lock, Zap, Eye, Maximize, X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateBasePayPrice, isBasePayEnabled } from "@/lib/utils";
import { paymasterService } from "@/lib/paymaster";
import { deductCreditOnPlay, incrementPlayCount, tipVideo } from "@/api/videos";
import { useBaseWallet } from "@/hooks/useBaseWallet";
import { useVideoPlayer } from "@/contexts/VideoPlayerContext";
import { usePortraitFullscreen } from "@/hooks/usePortraitFullscreen";
import { toast } from "@/hooks/use-toast";

interface VideoCardProps {
  title: string;
  topic?: string;
  duration: number;
  thumbnail?: string;
  onClick?: () => void;
  description?: string;
  src?: string;
  price?: number; // Price in wei/smallest units
  priceDisplay?: string; // Human readable price
  isLocked?: boolean;
  isFree?: boolean;
  onUnlock?: (paymentMethod: 'crypto' | 'basepay' | 'bulk', transactionHash?: string) => void;
  videoId?: string; // Video ID for credit deduction
  onCreditUpdate?: (remainingCredits: number) => void; // Callback for credit updates
  onViewUpdate?: () => void; // Callback for view count updates
  totalViews?: number; // Total view count for the video
  playCount?: number; // Play count for the video
  creatorWallet?: string; // Creator's wallet address for tipping
  totalTipsEarned?: number; // Total tips earned by this video
  showTipButton?: boolean; // Whether to show the tip button
}

const VideoCard = ({
  title,
  topic,
  duration,
  thumbnail,
  onClick,
  description = "",
  src = "",
  price = 0,
  priceDisplay = "Free",
  isLocked = false,
  isFree = true,
  onUnlock,
  videoId,
  onCreditUpdate,
  totalViews = 0,
  playCount = 0,
  creatorWallet,
  totalTipsEarned = 0,
  showTipButton = true
}: VideoCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isModalMounted, setIsModalMounted] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isInitiallyMuted, setIsInitiallyMuted] = useState(true);
  const [isTipping, setIsTipping] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationTime, setDurationTime] = useState(0);
  // Remove hasDeductedCredit state as we want to deduct credits on every play

  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const { user: walletUser, sendGaslessTransaction } = useBaseWallet();
  const { currentPlayingVideo, setCurrentPlayingVideo, registerVideo, unregisterVideo } = useVideoPlayer();
  const { togglePortraitFullscreen } = usePortraitFullscreen();

  const basePayEnabled = isBasePayEnabled();
  const basePayPricing = price > 0 ? calculateBasePayPrice(price) : null;

  // Register/unregister video element with the global player context
  useEffect(() => {
    if (videoRef.current && videoId) {
      registerVideo(videoId, videoRef.current);

      return () => {
        unregisterVideo(videoId);
      };
    }
  }, [videoId, registerVideo, unregisterVideo]);

  // Update current time and duration for custom controls
  useEffect(() => {
    const video = modalVideoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      if (video.duration && !isNaN(video.duration)) {
        setDurationTime(video.duration);
      }
    };

    const updateDuration = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDurationTime(video.duration);
      }
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('durationchange', updateDuration);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('durationchange', updateDuration);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [isModalMounted]);

  // Handle credit deduction when play button is clicked
  const handleCreditDeduction = async () => {
    if (!walletUser?.walletAddress || !videoId) {
      return true; // Allow playback if no wallet or videoId
    }

    try {
      const result = await deductCreditOnPlay(walletUser.walletAddress, videoId);

      if (result.success) {
        console.log('Credit deducted successfully:', result.data.message);

        // Update parent component with new credit balance
        if (onCreditUpdate && result.data.remainingCredits !== undefined) {
          onCreditUpdate(result.data.remainingCredits);
        }

        // If credits reach 0 after this deduction, show purchase prompt immediately
         if (result.data.remainingCredits === 0) {
           setTimeout(() => {
             setShowPaymentOptions(true);
           }, 1000); // Small delay to let the video start and user see the credit deduction
         }

        // Trigger a refresh of user data to update credits in navbar
        // This will be handled by the parent component that has access to refreshUser
        return true; // Allow playback
      } else {
        console.error('Failed to deduct credit:', result.error);

        // Check if it's an insufficient credits error
        if (result.error?.includes('Insufficient view credits')) {
          console.log('User has no credits remaining - showing payment options');
          return 'insufficient_credits'; // Special return value for insufficient credits
        }

        return false; // Prevent playback for other errors
      }
    } catch (error) {
      console.error('Error during credit deduction:', error);
      return false; // Prevent playback on error
    }
  };

  // Handle video play event (after credit deduction)
  const handleVideoPlay = async () => {
    // Set this video as the currently playing video
    if (videoId) {
      setCurrentPlayingVideo(videoId);

      // Increment play count when video starts playing
      try {
        const result = await incrementPlayCount(videoId);
        if (result.success) {
          console.log(`Play count incremented for video ${videoId}:`, result.data.playCount);
        } else {
          console.error('Failed to increment play count:', result.error);
        }
      } catch (error) {
        console.error('Error incrementing play count:', error);
      }
    }
    console.log('Video started playing for:', title);
  };

  // Handle video pause event
  const handleVideoPause = () => {
    // Clear the currently playing video if this video is paused
    if (videoId && currentPlayingVideo === videoId) {
      setCurrentPlayingVideo(null);
    }
    console.log('Video paused for:', title);
  };

  const closeModal = () => {
    console.log('Closing modal...');
    // Prevent multiple rapid close calls
    if (!isModalMounted) {
      console.log('Modal already closed, ignoring close call');
      return;
    }
    
    // Clear controls timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
    
    setIsModalVisible(false);
    setTimeout(() => {
      console.log('Modal closed, unmounting...');
      setIsModalMounted(false);
      // Reset audio state for next video
      setIsInitiallyMuted(true);
      // Reset controls state
      setShowVideoControls(false);
      // Pause modal video when closing
      if (modalVideoRef.current) {
        try { modalVideoRef.current.pause(); } catch { }
      }
    }, 200); // Match transition duration
  };

  // Handle ESC key to close modal
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isModalMounted) {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key === 'Escape' && showTipModal) {
      e.preventDefault();
      setShowTipModal(false);
      return;
    }
    // Modal playback shortcuts
    if (isModalMounted && modalVideoRef.current) {
      // Space: toggle play/pause
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (modalVideoRef.current.paused) {
          modalVideoRef.current.play().catch(() => {});
        } else {
          modalVideoRef.current.pause();
        }
      }
      // ArrowLeft/ArrowRight: seek ±5s
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        modalVideoRef.current.currentTime = Math.max(0, modalVideoRef.current.currentTime - 5);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const dur = isNaN(modalVideoRef.current.duration) ? Infinity : modalVideoRef.current.duration;
        modalVideoRef.current.currentTime = Math.min(dur, modalVideoRef.current.currentTime + 5);
      }
    }
  };

  // Handle video tipping
  const handleTipVideo = async () => {
    if (!walletUser?.walletAddress || !videoId || !creatorWallet) {
      toast({
        title: "Error",
        description: "Unable to process tip. Please ensure you're connected and the video has a creator.",
        variant: "destructive",
      });
      return;
    }

    if (walletUser.walletAddress === creatorWallet) {
      toast({
        title: "Cannot Tip",
        description: "You cannot tip your own video.",
        variant: "destructive",
      });
      return;
    }

    setIsTipping(true);
    try {
      const result = await tipVideo(videoId, walletUser.walletAddress, 0.1); // Fixed 0.1 USDC tip
      
      if (result.success) {
        toast({
          title: "Tip Sent!",
          description: `You tipped 0.1 USDC to the creator.`,
          variant: "default",
        });
        setShowTipModal(false);
        // Refresh user data if callback is provided
        if (onCreditUpdate) {
          onCreditUpdate(result.data.remainingCredits);
        }
      } else {
        toast({
          title: "Tip Failed",
          description: result.error || "Failed to send tip. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending tip:', error);
      toast({
        title: "Tip Error",
        description: "An error occurred while sending the tip.",
        variant: "destructive",
      });
    } finally {
      setIsTipping(false);
    }
  };

  // Add keyboard event listener for modal
  useEffect(() => {
    if (isModalMounted) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isModalMounted]);

  const handleClick = async () => {
    console.log('handleClick called for video:', title, 'isLocked:', isLocked);
    console.log('Current modal state - isModalMounted:', isModalMounted, 'isModalVisible:', isModalVisible);
    console.log('Video source:', src);
    
    // Prevent rapid clicking - if modal is already opening/open, don't open again
    if (isModalMounted || isModalVisible) {
      console.log('Modal already open or opening, ignoring click');
      return;
    }
    
    // Check if video source is available
    if (!src || src.trim() === '') {
      console.error('No video source available for:', title);
      setVideoError('Video source not available');
      return;
    }
    
    // Prevent video playback if locked (no credits available)
    if (isLocked) {
      console.log('Video is locked, showing payment options');
      setShowPaymentOptions(true);
      return;
    }

    // Always allow playback – credit gating removed
    console.log('Opening modal (credit gating removed)...');
    if (onClick) onClick();

    // Pause inline video to avoid double audio
    if (videoRef.current) {
      try { videoRef.current.pause(); } catch { }
    }

    console.log('Setting isModalMounted to true');
    // Open modal with smooth transition
    setIsModalMounted(true);
    // Wait for mount before showing to trigger transition
    requestAnimationFrame(() => {
      console.log('Setting isModalVisible to true');
      setIsModalVisible(true);
      // Show native controls initially for better usability
      setShowVideoControls(true);
    });
  };



  // Lock body scroll and handle ESC
  useEffect(() => {
    if (isModalMounted) {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeModal();
        }
      };
      document.addEventListener('keydown', onKeyDown);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', onKeyDown);
        document.body.style.overflow = prevOverflow;
        // Clean up hover timeout
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
      };
    }
  }, [isModalMounted]);

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden bg-card border border-border transition-all duration-300",
        onClick && "cursor-pointer",
        !isModalMounted && "hover:border-primary/50 hover-lift" // Only apply hover effects when modal is not open
      )}
      onMouseEnter={() => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        if (!isModalMounted) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (!isModalMounted) {
          hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
            hoverTimeoutRef.current = null;
          }, 100); // Small delay to prevent rapid hover/unhover
        }
      }}
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : -1}
      aria-label={`Video card: ${title}`}
      data-video-id={videoId}
    >
      {/* Credit Purchase Prompt Modal */}
      {showPaymentOptions && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
          <div className="bg-card p-6 rounded-xl border border-border max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold">Insufficient Credits</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              You need credits to watch this video. Each video view costs 1 credit.
            </p>
            <p className="text-sm text-blue-500 font-medium mb-6">
              Purchase credits to continue watching videos.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowPaymentOptions(false);
                  // Trigger credit purchase flow
                  window.dispatchEvent(new CustomEvent('purchaseCredits'));
                }}
                className="w-full p-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
              >
                Purchase Credits
              </button>
              <button
                onClick={() => setShowPaymentOptions(false)}
                className="w-full p-3 border border-border bg-background hover:bg-accent/50 text-foreground rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tip Modal */}
      {showTipModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
          <div className="bg-card p-6 rounded-xl border border-border max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold">Send a Tip</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Show your appreciation by tipping the creator 0.1 USDC for this video.
            </p>

            <div className="bg-gradient-to-r from-pink-500/10 to-red-500/10 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tip Amount:</span>
                <span className="text-lg font-bold text-pink-500">0.1 USDC</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleTipVideo}
                disabled={isTipping}
                className="w-full p-3 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTipping ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending Tip...
                  </div>
                ) : (
                  'Send Tip'
                )}
              </button>
              <button
                onClick={() => setShowTipModal(false)}
                className="w-full p-3 border border-border bg-background hover:bg-accent/50 text-foreground rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Video Preview Area */}
      <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent/20">
        {/* Render playable video when src is available AND user has credits */}
        {src && !isLocked ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              src={src}
              controls
              preload="metadata"
              poster={thumbnail}
              aria-label={`Video player for ${title}`}
              data-video-id={videoId}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onError={(e) => {
                // Silently handle video load errors to reduce console spam
                // The error suppression is handled globally in useBaseWallet
              }}
              onLoadStart={() => {
                console.log('Video load started for', title, 'with src:', src);
              }}
            />



            {/* Fullscreen Modal Button Overlay */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Fullscreen button clicked for:', title);
                console.log('Current modal state - isModalMounted:', isModalMounted, 'isModalVisible:', isModalVisible);
                // Reuse existing handler to perform credit checks and open modal
                handleClick();
              }}
              className={cn(
                "absolute bottom-3 right-3 p-2 rounded-full transition-all duration-200 hover:scale-110 z-10",
                src && src.trim() !== '' 
                  ? "bg-black/50 hover:bg-black/70 text-white" 
                  : "bg-gray-500/50 text-gray-300 cursor-not-allowed"
              )}
              aria-label="View in fullscreen modal"
              title={src && src.trim() !== '' ? "View in fullscreen modal" : "Video not available"}
              disabled={!src || src.trim() === ''}
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            {/* Thumbnail Image */}
            <img
              src={thumbnail}
              alt={`Thumbnail for ${title}`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />

            {/* Lock Overlay for videos when no credits available */}
            {isLocked && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-lg">
                <Lock className="w-8 h-8 text-white mb-2" />
                <p className="text-white text-sm font-medium mb-2 text-center px-4">
                  Video Locked
                </p>
                <p className="text-white/70 text-xs mb-3 text-center px-4">
                  Purchase credits to watch this video
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Trigger credit purchase flow
                    window.dispatchEvent(new CustomEvent('purchaseCredits'));
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                >
                  Buy Credits
                </button>
              </div>
            )}

            {/* Animated Background Placeholder for Videos with Credits */}
            {!isLocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-16 h-16 text-muted-foreground animate-pulse" aria-hidden="true" />
              </div>
            )}
          </>
        )}

        {/* Duration Badge */}
        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium" aria-label={`Duration ${duration}`}>
          {duration}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-accent font-bold uppercase">{topic}</div>
          {/* Price Display */}
          {!isFree && (
            <div className="flex items-center gap-2">
              {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
              <span className="text-xs font-medium text-primary">{priceDisplay}</span>
              {basePayEnabled && basePayPricing && (
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" />
                  <span className="text-xs text-muted-foreground">{basePayPricing.displayPrice}</span>
                </div>
              )}
            </div>
          )}
          {isFree && (
            <span className="text-xs font-medium text-green-500">Free</span>
          )}
        </div>
        <h3 className="text-sm font-bold line-clamp-2">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2" aria-label={`Description for ${title}`}>{description}</p>
        )}

        {/* View Count Display */}
        {totalViews > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>{totalViews.toLocaleString()} {totalViews === 1 ? 'view' : 'views'}</span>
          </div>
        )}

        {/* Play Count Display */}
        {playCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Play className="w-3 h-3" />
            <span>{playCount.toLocaleString()} {playCount === 1 ? 'play' : 'plays'}</span>
          </div>
        )}

        {/* Tips Display */}
        {totalTipsEarned > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="w-3 h-3 text-red-500" />
            <span>{totalTipsEarned.toFixed(2)} USDC in tips</span>
          </div>
        )}

        {/* Tip Button */}
        {showTipButton && walletUser?.walletAddress && creatorWallet && walletUser.walletAddress !== creatorWallet && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTipModal(true);
            }}
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105"
            disabled={isTipping}
          >
            <Heart className="w-3 h-3" />
            {isTipping ? 'Tipping...' : 'Tip 0.1 USDC'}
          </button>
        )}


      </div>

      {/* Modal Video Player Overlay */}
      {isModalMounted && (
        <div
          className={cn(
            "fixed inset-0 z-[100] flex justify-center items-center backdrop-blur-sm bg-black/80 transition-all duration-300 ease-in-out",
            isModalVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={(e) => {
            // Only close if clicking directly on backdrop, not on modal content
            // Add a small delay to prevent accidental clicks
            if (e.target === e.currentTarget) {
              setTimeout(() => {
                closeModal();
              }, 50);
            }
          }}
          aria-modal="true"
          role="dialog"
        >
          <div
            className={cn(
              "relative max-w-5xl w-full mx-4 bg-background rounded-xl overflow-hidden shadow-2xl transform transition-all duration-300 ease-in-out",
              isModalVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 bg-background/95 backdrop-blur-sm border-b border-border/50">
              <div className="flex items-center gap-3">
                <Play className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-foreground">{title}</h3>
                {topic && (
                  <span className="text-xs text-accent font-bold uppercase bg-accent/10 px-2 py-1 rounded-full">
                    {topic}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Unmute button for better audio experience */}
                {isInitiallyMuted && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsInitiallyMuted(false);
                      if (modalVideoRef.current) {
                        modalVideoRef.current.muted = false;
                        modalVideoRef.current.play().catch(err => {
                          console.log('Play after unmute failed:', err);
                        });
                      }
                    }}
                    className="p-2 hover:bg-accent/20 rounded-full transition-all duration-200 group"
                    aria-label="Unmute video"
                    title="Click to enable sound"
                  >
                    <svg className="w-5 h-5 text-muted-foreground group-hover:text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal();
                  }}
                  className="p-3 hover:bg-accent/20 rounded-full transition-all duration-200 hover:scale-110 group"
                  aria-label="Close modal"
                  title="Close modal (ESC)"
                >
                  <X className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            </div>
            
            {/* Video Container */}
            <div 
              className="relative bg-black"
              onClick={(e) => {
                e.stopPropagation();
                const target = e.target as Node;
                if (modalVideoRef.current && modalVideoRef.current.contains(target)) {
                  return;
                }
                setShowVideoControls(true);
                resetControlsTimer();
              }}
            >
              <div className="aspect-video">
                <video
                  ref={modalVideoRef}
                  className="relative z-10 w-full h-full object-contain"
                  src={src}
                  muted={isInitiallyMuted}
                  playsInline
                  poster={thumbnail}
                  controls
                  controlsList="nodownload"
                  style={{ touchAction: 'manipulation' }}
                  onMouseMove={(e) => {
                    e.stopPropagation();
                    setShowVideoControls(true);
                    resetControlsTimer();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVideoControls(true);
                    resetControlsTimer();
                  }}
                  onPlay={() => {
                    console.log('Modal video playing:', title);
                    setIsVideoLoading(false);
                    runCreditDeductionOnPlay();
                  }}
                  onPause={() => console.log('Modal video paused:', title)}
                  onError={(e) => {
                    console.log('Modal video error:', e);
                    setIsVideoLoading(false);
                    setVideoError('Failed to load video. Please try again.');
                  }}
                  onLoadStart={() => {
                    console.log('Modal video load started:', title);
                    setIsVideoLoading(true);
                    setVideoError(null);
                  }}
                  onLoadedData={() => console.log('Modal video data loaded:', title)}
                  onCanPlay={() => {
                    console.log('Modal video can play:', title);
                    setIsVideoLoading(false);
                    // Try to autoplay with initial mute, then unmute automatically
                    if (modalVideoRef.current) {
                      modalVideoRef.current.play().then(() => {
                        console.log('Video autoplayed successfully');
                        // Auto-unmute after successful autoplay for better user experience
                        setTimeout(() => {
                          setIsInitiallyMuted(false);
                          modalVideoRef.current!.muted = false;
                          console.log('Video automatically unmuted');
                        }, 1000); // Small delay to ensure smooth playback
                      }).catch(err => {
                        console.log('Autoplay prevented:', err);
                        // Video ready for user interaction, user can click play/unmute
                      });
                    }
                  }}
                />
                {/* Loading overlay */}
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-white text-sm">Loading video...</p>
                    </div>
                  </div>
                )}
                
                {/* Click to show controls overlay */}
                {!showVideoControls && !isVideoLoading && !videoError && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <div className="text-center">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mb-2">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <p className="text-white text-sm font-medium">Click to show controls</p>
                    </div>
                  </div>
                )}
                
                {/* Custom video controls overlay */}
                {showVideoControls && !isVideoLoading && !videoError && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (modalVideoRef.current) {
                              if (modalVideoRef.current.paused) {
                                modalVideoRef.current.play();
                              } else {
                                modalVideoRef.current.pause();
                              }
                            }
                          }}
                          className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        >
                          {modalVideoRef.current && !modalVideoRef.current.paused ? (
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        
                        <div className="text-white text-sm">
                          {Math.floor(currentTime / 60)}:{
                            Math.floor(currentTime % 60).toString().padStart(2, '0')
                          }
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (modalVideoRef.current) {
                              modalVideoRef.current.muted = !modalVideoRef.current.muted;
                              setIsInitiallyMuted(modalVideoRef.current.muted);
                            }
                          }}
                          className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        >
                          {modalVideoRef.current && modalVideoRef.current.muted ? (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a9 9 0 010 12" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9v6" />
                            </svg>
                          )}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (modalVideoRef.current) {
                              modalVideoRef.current.requestFullscreen();
                            }
                          }}
                          className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Progress bar (click to seek) */}
                    {durationTime > 0 && (
                      <div
                        className="mt-2 w-full bg-white/20 rounded-full h-1 relative cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!modalVideoRef.current || durationTime <= 0) return;
                          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const pct = Math.min(1, Math.max(0, x / rect.width));
                          modalVideoRef.current.currentTime = pct * durationTime;
                          setCurrentTime(modalVideoRef.current.currentTime);
                        }}
                        aria-label="Seek"
                        title="Click to jump in the video"
                      >
                        <div
                          className="bg-white h-1 rounded-full transition-all duration-300"
                          style={{ width: `${(currentTime / durationTime) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {/* Error overlay */}
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center p-6">
                      <p className="text-red-400 text-sm mb-4">{videoError}</p>
                      <button
                        onClick={() => {
                          setIsVideoLoading(true);
                          setVideoError(null);
                          if (modalVideoRef.current) {
                            modalVideoRef.current.load();
                          }
                        }}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Loading Indicator */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            </div>
            
            {/* Video Info Footer */}
            <div className="p-6 bg-background/95 backdrop-blur-sm border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {duration && (
                    <span className="flex items-center gap-1">
                      <span>Duration:</span>
                      <span className="font-medium text-foreground">{duration}</span>
                    </span>
                  )}
                  {totalViews > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{totalViews.toLocaleString()} views</span>
                    </span>
                  )}
                </div>
                {!isFree && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Price:</span>
                    <span className="font-bold text-primary">{priceDisplay}</span>
                  </div>
                )}
              </div>
              
              {description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoCard;
  const resetControlsTimer = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowVideoControls(false);
      controlsTimeoutRef.current = null;
    }, 3000);
  };
