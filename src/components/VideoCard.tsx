import { useState } from "react";
import { Play, Lock, Zap } from "lucide-react";
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
  isLocked?: boolean;
  isFree?: boolean;
  onUnlock?: (paymentMethod: 'crypto' | 'basepay') => void;
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
  onUnlock
}: VideoCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const basePayEnabled = isBasePayEnabled();
  const basePayPricing = price > 0 ? calculateBasePayPrice(price) : null;

  const handleClick = () => {
    if (isLocked && !isFree && onUnlock) {
      setShowPaymentOptions(true);
      return;
    }
    
    if (onClick) {
      onClick();
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
            <h3 className="text-lg font-bold mb-4 text-center">Unlock Video</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              Choose your payment method to unlock "{title}"
            </p>
            
            <div className="space-y-3">
              {/* Regular Payment */}
              <button
                onClick={() => handlePayment('crypto')}
                className="w-full p-4 border border-border rounded-lg hover:border-primary/50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">Regular Payment</div>
                    <div className="text-sm text-muted-foreground">{priceDisplay}</div>
                  </div>
                </div>
              </button>

              {/* BasePay Option */}
              {basePayEnabled && basePayPricing && (
                <button
                  onClick={() => handlePayment('basepay')}
                  className="w-full p-4 border border-primary/50 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium flex items-center gap-2">
                        BasePay <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Gasless</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{basePayPricing.displayPrice}</div>
                    </div>
                  </div>
                </button>
              )}
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
        {/* Render playable video when src is available */}
        {src ? (
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

            {/* Animated Background Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="w-16 h-16 text-muted-foreground animate-pulse" aria-hidden="true" />
            </div>
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
