import { useEffect, useState, useMemo } from "react";
import VideoCard from "./VideoCard";
import { recordVideoView, unlockVideo, unlockVideoWithBasePay, getVideos } from "@/api/videos";
import { useBaseWallet } from "@/hooks/useBaseWallet";
import { useToast } from "@/hooks/use-toast";
import { useCategory } from "@/contexts/CategoryContext";
import { encodeFunctionData } from "viem";
import { addViewCredits } from "@/api/users";

const ERC20_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }]
  }
] as const;

const VideoFeed = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected, user: walletUser, address, sendGaslessTransaction, getCurrentNetwork, refreshUser } = useBaseWallet();
  const { toast } = useToast();
  const { selectedCategory } = useCategory();

  // Debug wallet state changes
  useEffect(() => {
    // Listen for credit purchase events from VideoCard components
    const handlePurchaseCredits = () => {
      purchaseCredits();
    };

    window.addEventListener('purchaseCredits', handlePurchaseCredits);
    return () => window.removeEventListener('purchaseCredits', handlePurchaseCredits);
  }, []);

  useEffect(() => {
    console.log('🔍 VideoFeed - Wallet state changed:', {
      isConnected,
      address,
      hasUser: !!walletUser,
      userCredits: walletUser?.viewCredits
    });
  }, [isConnected, address, walletUser]);
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

  const purchaseCredits = async () => {
    try {
      if (!isConnected || !address) {
        toast({ title: 'Wallet not connected', description: 'Connect your wallet to purchase credits.' });
        return;
      }

      console.log('🛒 Starting credit purchase process...');

      const network = getCurrentNetwork();
      const env = (import.meta as any).env ?? {};
      const receiver = env.VITE_CREDITS_RECEIVER_ADDRESS as string | undefined;
      const usdcMainnet = env.VITE_USDC_MAINNET_ADDRESS as string | undefined;
      const usdcTestnet = env.VITE_USDC_TESTNET_ADDRESS as string | undefined;

      if (!receiver) {
        toast({ title: 'Receiver not configured', description: 'Set VITE_CREDITS_RECEIVER_ADDRESS in your environment.' });
        return;
      }

      const isTestnet = Boolean(network?.isTestnet) || String(network?.chainId) === '84532' || String(network?.name || '').toLowerCase().includes('sepolia');
      const usdcAddress = isTestnet ? usdcTestnet : usdcMainnet;
      if (!usdcAddress) {
        toast({ title: 'USDC address missing', description: 'Set USDC contract address env for current network.' });
        return;
      }

      // 1 USDC with 6 decimals
      const amount = 1_000_000n;
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [receiver as `0x${string}`, amount]
      });

      console.log('💸 Sending USDC transaction...', { to: usdcAddress, amount: amount.toString() });
      const txHash = await sendGaslessTransaction(usdcAddress, data, '0x0');
      console.log('✅ Transaction successful:', txHash);

      // After successful onchain payment, grant 10 credits
      console.log('🎯 Adding credits to user account...');
      const res = await addViewCredits(address, 10);

      if (res?.success) {
        console.log('✅ Credits added successfully:', res.data);
        toast({
          title: 'Credits purchased',
          description: `You now have ${res.data?.viewCredits || 'more'} view credits.`
        });
        await refreshUser();
      } else {
        console.error('❌ Credit update failed:', res);
        toast({
          title: 'Credits update failed',
          description: res?.error || 'Transaction succeeded but credit update failed. Please contact support.'
        });

        // Log transaction details for debugging
        console.error('Transaction succeeded but credit update failed:', {
          txHash,
          walletAddress: address,
          creditsToAdd: 10,
          apiResponse: res
        });
      }
    } catch (e: any) {
      console.error('❌ Error purchasing credits:', e);

      // Check if it's a transaction error or credit update error
      if (e.message?.includes('transaction')) {
        toast({
          title: 'Transaction failed',
          description: 'Your wallet was not debited. Please try again.'
        });
      } else {
        toast({
          title: 'Purchase failed',
          description: e?.message || 'Transaction could not be sent.'
        });
      }
    }
  };

  // Handle video unlock with payment method selection
  const handleVideoUnlock = async (videoId: string, paymentMethod: 'crypto' | 'basepay') => {
    if (!isConnected || !walletUser?._id) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to unlock videos",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate a mock transaction hash for testing
      const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Call the new video unlock API endpoint
      const response = await fetch('/api/video-unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: walletUser._id,
          videoId: videoId,
          transactionHash: mockTransactionHash,
          paymentMethod: paymentMethod,
          amount: 100000, // 0.1 USDC in wei
          amountDisplay: "0.1 USDC"
        })
      });

      const result = await response.json();

      if (result?.success) {
        toast({
          title: "Video Unlocked!",
          description: `Successfully unlocked with ${paymentMethod === 'basepay' ? 'BasePay' : 'regular payment'}`,
        });
        
        // Refresh user data to update unlocked videos
        await refreshUser();
        
        // Refresh videos to show unlocked status
        refetchVideos();
      } else {
        throw new Error(result?.error || 'Failed to unlock video');
      }
    } catch (error) {
      console.error('Error unlocking video:', error);
      toast({
        title: "Unlock Failed",
        description: error instanceof Error ? error.message : "Failed to unlock video",
        variant: "destructive",
      });
    }
  };



  // Function to refetch videos after unlock
  const refetchVideos = async () => {
    try {
      const result = await getVideos({ limit: 20 });
      if (result.success) {
        setVideos(result.data);
      }
    } catch (error) {
      console.error('Error refetching videos:', error);
    }
  };

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
          <div className="flex items-center gap-4">
            {isConnected && (
              <div className="text-sm">
                <span className="mr-2">Views left:</span>
                <span className="font-semibold">{walletUser?.viewCredits ?? 0}</span>
              </div>
            )}
            <button
              className={`px-3 py-2 rounded text-white text-sm transition-colors ${!isConnected
                  ? 'bg-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('=== BUY VIEWS BUTTON DEBUG ===');
                console.log('Button clicked!');
                console.log('isConnected:', isConnected);
                console.log('address:', address);
                console.log('walletUser:', walletUser);
                console.log('Button disabled:', !isConnected);
                console.log('================================');

                if (!isConnected) {
                  console.log('Wallet not connected, button should be disabled');
                  toast({
                    title: "Wallet Not Connected",
                    description: "Please connect your wallet first",
                    variant: "destructive",
                  });
                  return;
                }

                purchaseCredits();
              }}
              disabled={!isConnected}
              title={!isConnected ? "Connect your wallet first" : "Purchase 10 view credits for $1 USDC"}
              type="button"
            >
              Buy 10 Views ($1 USDC)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredVideos.map((video) => {
            const id = video._id || video.id;
            
            // Check if user has unlocked this video
            const isVideoUnlocked = walletUser?.videosUnlocked?.includes(id) || false;
            
            // ALL videos are now locked if user has no credits
            const hasCredits = walletUser?.viewCredits > 0;
            const isVideoLocked = !hasCredits; // Lock ALL videos when no credits
            
            const videoPrice = video.price || 100000; // Default 0.1 USDC in wei
            const videoPriceDisplay = video.priceDisplay || "0.1 USDC";

            return (
              <VideoCard
                key={id}
                title={video.title}
                topic={video.category}
                duration={`${video.duration}s`}
                thumbnail={video.thumbnail || "/placeholder.svg"}
                description={video.description || ''}
                src={getVideoSrc(video)}
                price={videoPrice}
                priceDisplay={videoPriceDisplay}
                isLocked={isVideoLocked}
                isFree={video.isFree || false}
                onUnlock={(paymentMethod) => handleVideoUnlock(id, paymentMethod)}
                onClick={async () => {
                  try {
                    // Check if user has sufficient view credits for ALL videos
                    if (walletUser?.viewCredits <= 0) {
                      toast({ 
                        title: 'No views left', 
                        description: 'Purchase credits to watch videos. 1 USDC = 10 views.' 
                      });
                      return;
                    }
                    
                    if (isConnected && walletUser?._id) {
                      const result = await recordVideoView(id, walletUser._id);
                      if (!result?.success && result?.error?.toLowerCase().includes('insufficient view credits')) {
                        toast({ title: 'No views left', description: 'Purchase credits to keep watching.' });
                        return;
                      }
                      // Refresh user data to update view credits in real-time
                      if (result?.success) {
                        await refreshUser();
                      }
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
    tipAmount: 100000,
    tipAmountDisplay: "0.1 USDC",
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
    tipAmount: 100000,
    tipAmountDisplay: "0.1 USDC",
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
    tipAmount: 100000,
    tipAmountDisplay: "0.1 USDC",
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
    tipAmount: 100000,
    tipAmountDisplay: "0.1 USDC",
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
    tipAmount: 100000,
    tipAmountDisplay: "0.1 USDC",
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
    tipAmount: 100000,
    tipAmountDisplay: "0.1 USDC",
    thumbnail: "",
    locked: false,
    isFree: true, // This is a free video
    description: "A playful breakdown of smart contracts with simple analogies.",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  },
];

export default VideoFeed;
