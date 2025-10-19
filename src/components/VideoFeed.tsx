import { useEffect, useState, useMemo } from "react";
import VideoCard from "./VideoCard";
import { getVideos, recordVideoView } from "@/api/videos";
import { useBaseWallet } from "@/hooks/useBaseWallet";
import { useToast } from "@/hooks/use-toast";
import { useCategory } from "@/contexts/CategoryContext";

const VideoFeed = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected, user: walletUser } = useBaseWallet();
  const { toast } = useToast();
  const { selectedCategory } = useCategory();

  const getVideoSrc = (video: any) => {
    const url = video?.videoUrl || '';
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    // For local videos, serve directly from public directory
    if (url.startsWith('/videos/')) {
      return url; // Already in correct format
    }
    const base = url.split('/').pop();
    if (!base) return '';
    return `/videos/${base}`;
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const result = await getVideos({ limit: 20 });
        if (result.success) {
          setVideos(result.data);
        } else {
          console.error('Failed to fetch videos:', result.error);
          // Fallback to mock data if API fails
          setVideos(mockVideos);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
        // Fallback to mock data if API fails
        setVideos(mockVideos);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'all') {
      return videos;
    }
    return videos.filter(video => video.category === selectedCategory);
  }, [videos, selectedCategory]);

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">
              Latest <span className="text-gradient">Drops</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-48"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12" aria-label="Latest Drops">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">
            Latest <span className="text-gradient">Drops</span>
          </h2>
          <div className="text-sm text-muted-foreground" aria-live="polite">
            {filteredVideos.length} videos available
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredVideos.map((video) => {
            const id = video._id || video.id;
            return (
              <VideoCard
                key={id}
                title={video.title}
                topic={video.category}
                duration={`${video.duration}s`}
                thumbnail={video.thumbnail || "/placeholder.svg"}
                description={video.description || ''}
                src={getVideoSrc(video)}
                onClick={async () => {
                  try {
                    if (isConnected && walletUser?._id) {
                      await recordVideoView(id, walletUser._id);
                    }
                    // Video play action - removed console.log for production
                  } catch (e) { 
                    console.error('Error playing video:', e); 
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

const mockVideos = [
  {
    id: 1,
    title: "AI Agents Are Hiring Each Other Now??? 😱",
    topic: "AI Agents",
    category: "AI Agents",
    duration: 28,
    price: "0.1 USDC",
    priceDisplay: "0.1 USDC",
    thumbnail: "",
    locked: true,
    isFree: false,
  },
  {
    id: 2,
    title: "Your Grandma Could Trade DeFi After This",
    topic: "DeFi",
    category: "DeFi",
    duration: 35,
    price: "0.1 USDC",
    priceDisplay: "0.1 USDC",
    thumbnail: "",
    locked: false,
    isFree: true, // This is a free video
    description: "A friendly intro to trading in decentralized finance platforms.",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  },
  {
    id: 3,
    title: "NFTs Aren't Dead, You're Just Using Them Wrong",
    topic: "NFTs",
    category: "NFTs",
    duration: 42,
    price: "0.1 USDC",
    priceDisplay: "0.1 USDC",
    thumbnail: "",
    locked: true,
    isFree: false,
  },
  {
    id: 4,
    title: "Prediction Markets Will Replace Polls (Here's Why)",
    topic: "Prediction Markets",
    category: "Prediction Markets",
    duration: 31,
    price: "0.1 USDC",
    priceDisplay: "0.1 USDC",
    thumbnail: "",
    locked: false,
    isFree: true, // This is a free video
    description: "Why crowdsourced prediction beats traditional polling methodologies.",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  },
  {
    id: 5,
    title: "How to NOT Get Rugged in 30 Seconds",
    topic: "Web3 Security",
    category: "Web3 Security",
    duration: 30,
    price: "0.1 USDC",
    priceDisplay: "0.1 USDC",
    thumbnail: "",
    locked: true,
    isFree: false,
  },
  {
    id: 6,
    title: "Smart Contracts Explained Like You're 5 (But Make It Spicy)",
    topic: "DeFi",
    category: "DeFi",
    duration: 38,
    price: "0.1 USDC",
    priceDisplay: "0.1 USDC",
    thumbnail: "",
    locked: false,
    isFree: true, // This is a free video
    description: "A playful breakdown of smart contracts with simple analogies.",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  },
];

export default VideoFeed;
