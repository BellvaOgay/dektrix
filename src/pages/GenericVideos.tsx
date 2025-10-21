import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { Play, Clock, User, Lock, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getPerViewChargeDisplay } from "@/lib/utils";
import { getVideos } from "@/api/videos";
import { deductCreditOnPlay } from "@/api/videos";
import { useBaseWallet } from "@/hooks/useBaseWallet";

const GenericVideos = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const [deductedVideos, setDeductedVideos] = useState<Set<string>>(new Set());
  
  const { user: walletUser } = useBaseWallet();

  useEffect(() => {
    fetchGenericVideos();
  }, []);

  const fetchGenericVideos = async () => {
    try {
      const result = await getVideos({ limit: 20 });
      if (result.success) {
        setVideos(result.data);
      } else {
        console.error('Failed to fetch videos:', result.error);
      }
    } catch (error) {
      console.error('Error fetching generic videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const perViewDisplay = getPerViewChargeDisplay();

  // Handle credit deduction when video starts playing
  const handleVideoPlay = async (videoId: string) => {
    if (!walletUser?.walletAddress || !videoId || deductedVideos.has(videoId)) {
      return;
    }

    try {
      const result = await deductCreditOnPlay(walletUser.walletAddress, videoId);
      
      if (result.success) {
        setDeductedVideos(prev => new Set(prev).add(videoId));
        console.log('Credit deducted successfully for video:', videoId);
      } else {
        console.error('Failed to deduct credit:', result.error);
        // If credit deduction fails, pause the video
        const videoElement = document.querySelector(`video[data-video-id="${videoId}"]`) as HTMLVideoElement;
        if (videoElement) {
          videoElement.pause();
        }
      }
    } catch (error) {
      console.error('Error during credit deduction:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading generic videos...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <section className="py-12" aria-label="Generic Videos">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gradient mb-4">Video Library</h1>
              <p className="text-muted-foreground text-lg">
                Explore our collection of educational videos. Free content available to all users, 
                premium content requires wallet connection.
              </p>
            </div>

            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                Latest <span className="text-gradient">Drops</span>
              </h2>
              <div className="text-sm text-muted-foreground" aria-live="polite">
                {videos.length} videos available
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={cn(
                    "relative rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover-lift cursor-pointer"
                  )}
                  onMouseEnter={() => setIsHovered(video.id)}
                  onMouseLeave={() => setIsHovered(null)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Video card: ${video.title}`}
                >
                  {/* Video Preview Area */}
                  <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent/20">
                    {/* Check if user has credits to watch videos */}
                    {walletUser && walletUser.viewCredits > 0 ? (
                      <video
                        className="absolute inset-0 w-full h-full object-cover"
                        src={video.videoUrl}
                        controls
                        preload="metadata"
                        poster={video.thumbnail || "/placeholder.svg"}
                        aria-label={`Video player for ${video.title}`}
                        data-video-id={video._id}
                        onPlay={() => handleVideoPlay(video._id)}
                      />
                    ) : (
                      <>
                        {/* Thumbnail Image */}
                        <img
                          src={video.thumbnail || "/placeholder.svg"}
                          alt={`Thumbnail for ${video.title}`}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />

                        {/* Lock Overlay for videos when no credits available */}
                        {walletUser && walletUser.viewCredits <= 0 && (
                          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-lg">
                            <div className="w-8 h-8 text-white mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                              </svg>
                            </div>
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

                        {/* Play button for videos with credits */}
                        {(!walletUser || walletUser.viewCredits > 0) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 text-muted-foreground animate-pulse" aria-hidden="true">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Per-view Price Badge */}
                    <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                      Per view: {perViewDisplay}
                    </div>

                    {/* Free Content Indicator */}
                    {video.isFree && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        FREE
                      </div>
                    )}

                    {/* Duration Badge */}
                    <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium" aria-label={`Duration ${video.duration}`}>
                      {video.duration}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="p-4 space-y-2">
                    <div className="text-xs text-accent font-bold uppercase">{video.category}</div>
                    <h3 className="text-sm font-bold line-clamp-2">{video.title}</h3>
                    {video.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2" aria-label={`Description for ${video.title}`}>{video.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {videos.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No generic videos available</p>
                  <p className="text-sm">Check back later for new content</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default GenericVideos;