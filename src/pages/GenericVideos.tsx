import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { Play, Clock, User, Lock, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getPerViewChargeDisplay } from "@/lib/utils";
import { getGenericVideos, type GenericVideo } from "@/api/generic-videos";

const GenericVideos = () => {
  const [videos, setVideos] = useState<GenericVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState<string | null>(null);

  useEffect(() => {
    fetchGenericVideos();
  }, []);

  const fetchGenericVideos = async () => {
    try {
      const data = await getGenericVideos();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching generic videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const perViewDisplay = getPerViewChargeDisplay();

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
                    {/* Always render playable video */}
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      src={video.videoUrl}
                      controls
                      preload="metadata"
                      poster={video.thumbnail || "/placeholder.svg"}
                      aria-label={`Video player for ${video.title}`}
                    />

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