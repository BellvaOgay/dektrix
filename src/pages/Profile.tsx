import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Upload, Video, DollarSign, User, Heart, Eye, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBaseWallet } from '@/hooks/useBaseWallet';
import { getUserByWallet } from '@/api/users';
import { getVideos } from '@/api/videos';
import { withdrawTips } from '@/api/users';
import UploadVideoModal from '@/components/UploadVideoModal';
import Navbar from '@/components/Navbar';

interface UserData {
  _id: string;
  walletAddress: string;
  username: string;
  bio: string;
  avatar: string;
  viewCredits: number;
  totalTipsEarned: number;
  totalTipsSpent: number;
  videosUnlocked: string[];
  videosTipped: string[];
  uploadedVideos: string[];
  withdrawalHistory: any[];
}

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
  category: string;
  tags: string[];
  price: number;
  priceDisplay: string;
  isFree: boolean;
  creatorWallet: string;
  totalViews: number;
  playCount: number;
  totalTipsEarned: number;
  createdAt: string;
}

const Profile: React.FC = () => {
  const { walletAddress } = useParams<{ walletAddress?: string }>();
  const { user: walletUser, isConnected } = useBaseWallet();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userVideos, setUserVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { toast } = useToast();

  const isOwner = !walletAddress || walletAddress === walletUser?.walletAddress;
  const displayAddress = walletAddress || walletUser?.walletAddress;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!displayAddress) return;

      try {
        setLoading(true);
        
        // Fetch user data
        const userResult = await getUserByWallet(displayAddress);
        if (userResult.success) {
          setUserData(userResult.data);
        }

        // Fetch user's videos
        const videosResult = await getVideos();
        if (videosResult.success) {
          const userVideos = videosResult.data.filter((video: Video) => 
            video.creatorWallet?.toLowerCase() === displayAddress.toLowerCase()
          );
          setUserVideos(userVideos);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [displayAddress, toast]);

  const handleCopyAddress = () => {
    if (userData?.walletAddress) {
      navigator.clipboard.writeText(userData.walletAddress);
      toast({
        title: 'Copied',
        description: 'Wallet address copied to clipboard'
      });
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!walletUser?.walletAddress) return;

    try {
      const response = await fetch('/api/videos/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          walletAddress: walletUser.walletAddress
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Video deleted successfully'
        });
        // Refresh the video list
        const videosResult = await getVideos();
        if (videosResult.success) {
          const userVideos = videosResult.data.filter((video: Video) => 
            video.creatorWallet?.toLowerCase() === displayAddress?.toLowerCase()
          );
          setUserVideos(userVideos);
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete video',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete video',
        variant: 'destructive'
      });
    }
  };

  const handleWithdraw = async () => {
    if (!walletUser?.walletAddress || !userData) return;

    if (userData.totalTipsEarned < 5000000) { // 5 USDC minimum
      toast({
        title: 'Minimum withdrawal not met',
        description: 'You need at least 5 USDC to withdraw',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsWithdrawing(true);
      const result = await withdrawTips(walletUser.walletAddress, userData.totalTipsEarned);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Successfully withdrew ${(userData.totalTipsEarned / 1000000).toFixed(2)} USDC`
        });
        // Refresh user data
        const userResult = await getUserByWallet(displayAddress!);
        if (userResult.success) {
          setUserData(userResult.data);
        }
      } else {
        toast({
          title: 'Withdrawal failed',
          description: result.error || 'Failed to withdraw tips',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error withdrawing tips:', error);
      toast({
        title: 'Error',
        description: 'Failed to withdraw tips',
        variant: 'destructive',
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-8"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={userData.avatar || '/placeholder.svg'} alt={userData.username} />
                <AvatarFallback>
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{userData.username}</h1>
                  {isOwner && (
                    <Badge variant="secondary" className="text-xs">
                      Your Profile
                    </Badge>
                  )}
                </div>
                
                <p className="text-muted-foreground mb-4">{userData.bio || 'No bio available'}</p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Copy className="h-4 w-4" />
                    <span>{userData.walletAddress.slice(0, 6)}...{userData.walletAddress.slice(-4)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={handleCopyAddress}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold">{userVideos.length}</div>
                  <div className="text-sm text-muted-foreground">Videos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{(userData.totalTipsEarned / 1000000).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">USDC Earned</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{userData.viewCredits}</div>
                  <div className="text-sm text-muted-foreground">View Credits</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            {isOwner && <TabsTrigger value="upload">Upload</TabsTrigger>}
          </TabsList>

          <TabsContent value="videos">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userVideos.map((video) => (
                <Card key={video._id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-100 relative">
                    <img 
                      src={video.thumbnail || '/placeholder.svg'} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        {video.duration}s
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{video.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{video.totalViews}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{(video.totalTipsEarned / 1000000).toFixed(2)} USDC</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {isOwner && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDeleteVideo(video._id)}
                        >
                          Delete
                        </Button>
                      )}
                      {!isOwner && (
                        <Button size="sm" className="flex-1">
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Watch
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {userVideos.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No videos uploaded yet</p>
                  {isOwner && (
                    <Button 
                      className="mt-4"
                      onClick={() => setShowUploadModal(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Your First Video
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="earnings">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Total Earnings</CardTitle>
                  <CardDescription>Your total tips earned from videos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {(userData.totalTipsEarned / 1000000).toFixed(2)} USDC
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ≈ ${(userData.totalTipsEarned / 1000000).toFixed(2)} USD
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Withdraw Tips</CardTitle>
                  <CardDescription>Withdraw your earnings to your wallet</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="text-sm text-muted-foreground mb-2">Available for withdrawal:</div>
                    <div className="text-2xl font-bold">
                      {(userData.totalTipsEarned / 1000000).toFixed(2)} USDC
                    </div>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={handleWithdraw}
                    disabled={isWithdrawing || userData.totalTipsEarned < 5000000}
                  >
                    {isWithdrawing ? (
                      'Processing...'
                    ) : userData.totalTipsEarned < 5000000 ? (
                      'Minimum 5 USDC required'
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Withdraw Tips
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {isOwner && (
            <TabsContent value="upload">
              <div className="text-center py-12">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Upload New Video</h3>
                <p className="text-muted-foreground mb-6">
                  Share your knowledge and earn tips from viewers
                </p>
                <Button 
                  size="lg"
                  onClick={() => setShowUploadModal(true)}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Video
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadVideoModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={async () => {
            // Refresh videos after upload
            const videosResult = await getVideos();
            if (videosResult.success) {
              const userVideos = videosResult.data.filter((video: Video) => 
                video.creatorWallet?.toLowerCase() === displayAddress?.toLowerCase()
              );
              setUserVideos(userVideos);
            }
          }}
        />
      )}
    </div>
  );
};

export default Profile;