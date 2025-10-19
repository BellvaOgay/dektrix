import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  title: string;
  topic: string;
  duration: string;
  thumbnail: string;
  onClick?: () => void;
  description?: string;
  src?: string;
}

const VideoCard = ({ title, topic, duration, thumbnail, onClick, description = "", src = "" }: VideoCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
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
              console.error('Video load error for', title, ':', e);
              console.error('Video src:', src);
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
        <div className="text-xs text-accent font-bold uppercase">{topic}</div>
        <h3 className="text-sm font-bold line-clamp-2">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2" aria-label={`Description for ${title}`}>{description}</p>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
