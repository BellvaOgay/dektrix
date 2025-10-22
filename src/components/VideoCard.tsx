import { useState, useRef, useEffect } from "react";
import { Play, Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateBasePayPrice, isBasePayEnabled } from "@/lib/utils";
import { deductCreditOnPlay } from "@/api/videos";
import { useBaseWallet } from "@/hooks/useBaseWallet";
import { useVideoPlayer } from "@/contexts/VideoPlayerContext";

interface VideoCardProps {
  title: string;
  topic: string;
  duration: string;
  thumbnail: string;
  onClick?: () => void;
  description?: string;
  src?: string;
  price?: number; // Price in wei/smallest units
  priceDisplay?: string; // Human readable price
  isLocked?: boolean;
  isFree?: boolean;
  onUnlock?: (paymentMethod: 'crypto' | 'basepay') => void;
  videoId?: string; // Video ID for credit deduction
  onCreditUpdate?: (remainingCredits: number) => void; // Callback for credit updates
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
  onCreditUpdate
}: VideoCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [hasDeductedCredit, setHasDeductedCredit] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user: walletUser } = useBaseWallet();
  const { currentPlayingVideo, setCurrentPlayingVideo, registerVideo, unregisterVideo } = useVideoPlayer();

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

  // Handle credit deduction when play button is clicked
  const handleCreditDeduction = async () => {
    if (!walletUser?.walletAddress || !videoId || hasDeductedCredit) {
      return true; // Allow playback if already deducted or no wallet
    }

    try {
      const result = await deductCreditOnPlay(walletUser.walletAddress, videoId);

      if (result.success) {
        setHasDeductedCredit(true);
        console.log('Credit deducted successfully:', result.data.message);

        // Update parent component with new credit balance
        if (onCreditUpdate && result.data.remainingCredits !== undefined) {
          onCreditUpdate(result.data.remainingCredits);
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

  const handleClick = async () => {
    // Prevent video playback if locked (no credits available)
    if (isLocked) {
      setShowPaymentOptions(true);
      return;
    }

    // Deduct credit before allowing video playback
    if (!isLocked) {
      const canPlay = await handleCreditDeduction();

      if (canPlay === true && onClick) {
        onClick();
      } else if (canPlay === 'insufficient_credits') {
        // User ran out of credits - show payment options
        console.log('Insufficient credits - showing payment options');
        setShowPaymentOptions(true);
      } else if (canPlay === false) {
        // Other error occurred - show payment options as fallback
        console.error('Cannot play video: Credit deduction failed');
        setShowPaymentOptions(true);
      }
    }
  };

  const handlePayment = (paymentMethod: 'crypto' | 'basepay') => {
    setShowPaymentOptions(false);
    if (onUnlock) {
      onUnlock(paymentMethod);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover-lift",
        onClick && "cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : -1}
      aria-label={`Video card: ${title}`}
    >
      {/* Payment Options Modal */}
      {showPaymentOptions && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
          <div className="bg-card p-6 rounded-xl border border-border max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-center">Purchase Credits</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              You need credits to watch videos. Purchase 10 views for 1 USDC.
            </p>

            <div className="space-y-3">
              {/* Credit Purchase Button */}
              <button
                onClick={() => {
                  setShowPaymentOptions(false);
                  // This will be handled by the parent component's purchase credits function
                  window.dispatchEvent(new CustomEvent('purchaseCredits'));
                }}
                className="w-full p-4 border border-primary/50 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-center"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <div className="text-center">
                    <div className="font-medium">Buy 10 Views</div>
                    <div className="text-sm text-muted-foreground">1 USDC</div>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowPaymentOptions(false)}
              className="w-full mt-4 p-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Video Preview Area */}
      <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent/20">
        {/* Render playable video when src is available AND user has credits */}
        {src && !isLocked ? (
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
                <p className="text-white text-sm font-medium mb-3 text-center px-4">
                  No credits remaining
                </p>
                <p className="text-white/70 text-xs mb-3 text-center px-4">
                  Purchase more views to continue watching
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Dispatch custom event for credit purchase
                    window.dispatchEvent(new CustomEvent('purchaseCredits'));
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                >
                  Buy More Views
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


      </div>
    </div>
  );
};

export default VideoCard;
