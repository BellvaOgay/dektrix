import { useState } from "react";
import { Play, Lock, Zap, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateBasePayPrice, isBasePayEnabled } from "@/lib/utils";

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
  tipAmount?: number; // Fixed tip amount in wei
  tipAmountDisplay?: string; // Human readable tip amount
  isLocked?: boolean;
  isFree?: boolean;
  hasTipped?: boolean; // New prop to track if user has tipped this video
  onUnlock?: (paymentMethod: 'crypto' | 'basepay') => void;
  onTip?: (paymentMethod: 'crypto' | 'basepay') => void;
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
  tipAmount = 100000, // Default 0.1 USDC in wei
  tipAmountDisplay = "0.1 USDC",
  isLocked = false,
  isFree = true,
  hasTipped = false,
  onUnlock,
  onTip
}: VideoCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const basePayEnabled = isBasePayEnabled();
  const basePayPricing = price > 0 ? calculateBasePayPrice(price) : null;

  const handleClick = () => {
    // Prevent video playback if locked (no credits available)
    if (isLocked) {
      setShowPaymentOptions(true);
      return;
    }
    
    // Allow video playback if user has credits
    if (!isLocked && onClick) {
      onClick();
      return;
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
            className="absolute inset-0 w-full h-full object-cover"
            src={src}
            controls
            preload="metadata"
            poster={thumbnail}
            aria-label={`Video player for ${title}`}
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

            {/* Lock Overlay for ALL Videos when no credits */}
            {isLocked && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center text-white">
                  <Lock className="w-12 h-12 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">No Credits Available</p>
                  <p className="text-xs text-gray-300">Purchase credits to watch videos</p>
                </div>
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
        
        {/* Tip Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex-1">
            {/* Tip requirement indicator for non-free videos */}
            {!isFree && !hasTipped && (
              <div className="flex items-center gap-1 text-xs text-amber-500">
                <Heart className="w-3 h-3" />
                <span>Tip to view</span>
              </div>
            )}
            {!isFree && hasTipped && (
              <div className="flex items-center gap-1 text-xs text-green-500">
                <Heart className="w-3 h-3 fill-current" />
                <span>Tipped</span>
              </div>
            )}
          </div>
          
          {/* Tip Button with Payment Options */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (basePayEnabled) {
                  setShowPaymentOptions(!showPaymentOptions);
                } else if (onTip) {
                  onTip('crypto');
                }
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-white text-xs font-medium rounded-full transition-all duration-200 hover:scale-105 shadow-sm",
                hasTipped 
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  : "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
              )}
              title={`Tip ${tipAmountDisplay}`}
            >
              <Heart className={cn("w-3 h-3", hasTipped && "fill-current")} />
              <span>{hasTipped ? "Tipped" : `Tip ${tipAmountDisplay}`}</span>
            </button>

            {/* Payment Options Dropdown */}
            {showPaymentOptions && basePayEnabled && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPaymentOptions(false);
                    if (onTip) onTip('crypto');
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                >
                  💳 Crypto
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPaymentOptions(false);
                    if (onTip) onTip('basepay');
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-primary" />
                  BasePay
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
