import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Upload, Video, Image, User, DollarSign, PlayCircle, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBaseWallet } from '@/hooks/useBaseWallet';
import { getVideos } from '@/api/videos';
import { getOrCreateCreator, getCreatorByWallet, updateCreator } from '@/api/creators';
import type { ICreator } from '@/models/Creator';

const videoUploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  category: z.enum(['AI Agents', 'DeFi', 'Blockchain', 'NFTs', 'Web3', 'Crypto', 'Smart Contracts', 'DAOs', 'Generic']),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  price: z.number().min(0, 'Price must be positive'),
  priceDisplay: z.string().min(1, 'Price display is required'),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  duration: z.number().min(1, 'Duration must be at least 1 second').max(300, 'Duration must be less than 5 minutes'),
  featured: z.boolean().default(false),
});

type VideoUploadForm = z.infer<typeof videoUploadSchema>;

const CreatorProfile: React.FC = () => {
  const { user, isConnected } = useBaseWallet();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [creatorVideos, setCreatorVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<ICreator | null>(null);
  const [creatorLoading, setCreatorLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<VideoUploadForm>({
    resolver: zodResolver(videoUploadSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'AI Agents',
      difficulty: 'Beginner',
      price: 0.01,
      priceDisplay: '$0.01',
      tags: [],
      duration: 60,
      featured: false,
    },
  });

  // Load creator profile from MongoDB
  useEffect(() => {
    const loadCreatorProfile = async () => {
      if (!user?.walletAddress) return;

      try {
        setCreatorLoading(true);
        // Get or create creator profile
        const result = await getOrCreateCreator(
          user.walletAddress,
          user.username || user.displayName || 'Anonymous',
          user.bio || 'Creator on Dektrix platform'
        );
        setCreator(result.creator);
      } catch (error) {
        console.error('Error loading creator profile:', error);
        toast({
          title: 'Error loading profile',
          description: 'Failed to load creator profile. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setCreatorLoading(false);
      }
    };

    loadCreatorProfile();
  }, [user, toast]);

  // Load creator's videos
  useEffect(() => {
    const loadCreatorVideos = async () => {
      if (!user?._id) return;

      try {
        const result = await getVideos();
        if (result.success) {
          // Filter videos by creator ID
          const userVideos = result.videos.filter((video: any) =>
            video.creator?._id === user._id || video.creator === user._id
          );
          setCreatorVideos(userVideos);
        }
      } catch (error) {
        console.error('Error loading creator videos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCreatorVideos();
  }, [user]);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        // Get video duration
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          form.setValue('duration', Math.floor(video.duration));
        };
        video.src = URL.createObjectURL(file);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please select a video file',
          variant: 'destructive',
        });
      }
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setThumbnailFile(file);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
      }
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !form.getValues('tags').includes(tagInput.trim())) {
      const currentTags = form.getValues('tags');
      if (currentTags.length < 10) {
        form.setValue('tags', [...currentTags, tagInput.trim()]);
        setTagInput('');
      } else {
        toast({
          title: 'Maximum tags reached',
          description: 'You can only add up to 10 tags',
          variant: 'destructive',
        });
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: VideoUploadForm) => {
    if (!videoFile || !thumbnailFile) {
      toast({
        title: 'Missing files',
        description: 'Please select both video and thumbnail files',
        variant: 'destructive',
      });
      return;
    }

    if (!user?._id) {
      toast({
        title: 'Authentication required',
        description: 'Please connect your wallet to upload videos',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Import the createVideo API function
      const { createVideo } = await import('@/api/videos');

      // In a real implementation, you would upload files to a storage service
      // For now, we'll create placeholder URLs
      const videoUrl = URL.createObjectURL(videoFile);
      const thumbnailUrl = URL.createObjectURL(thumbnailFile);

      // Create the video in the database
      const result = await createVideo({
        title: data.title,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty,
        price: data.price,
        priceDisplay: data.priceDisplay,
        tags: data.tags,
        duration: data.duration,
        featured: data.featured,
        videoUrl: videoUrl,
        thumbnail: thumbnailUrl,
        isActive: true,
        creatorWallet: user.walletAddress, // Use creatorWallet instead of creator ObjectId
        isFree: data.price === 0,
      });

      if (result.success) {
        toast({
          title: 'Video uploaded successfully!',
          description: 'Your video has been uploaded and is now available.',
        });

        // Reset form
        form.reset();
        setVideoFile(null);
        setThumbnailFile(null);
        setTagInput('');

        // Reload creator videos
        const videosResult = await getVideos();
        if (videosResult.success) {
          const userVideos = videosResult.videos.filter((video: any) =>
            video.creator?._id === user._id || video.creator === user._id
          );
          setCreatorVideos(userVideos);
        }
      } else {
        throw new Error(result.error || 'Failed to create video');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your video. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isConnected || !user) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 text-center">
              Please connect your wallet to access your creator profile and upload videos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalVideos = creatorVideos.length;
  const totalViews = creatorVideos.reduce((sum, video) => sum + (video.totalViews || 0), 0);
  const totalEarnings = creator?.total_earned_usdc || user.totalTipsEarned || 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Creator Profile Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={creator?.profile_image_url || user.avatar} alt={creator?.username || user.displayName || user.username} />
              <AvatarFallback className="text-lg">
                {(creator?.username || user.displayName || user.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">
                {creator?.username || user.displayName || user.username}
              </h1>
              <p className="text-gray-600 mb-4">
                {creator?.bio || user.bio || 'Creator on Dektrix platform'}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-semibold">{totalVideos}</div>
                    <div className="text-sm text-gray-600">Videos</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-semibold">{totalViews.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Views</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-semibold">${totalEarnings.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Tips Earned</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="videos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="videos">My Videos</TabsTrigger>
          <TabsTrigger value="upload">Upload Video</TabsTrigger>
          <TabsTrigger value="profile">Edit Profile</TabsTrigger>
        </TabsList>

        {/* My Videos Tab */}
        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <CardTitle>My Videos</CardTitle>
              <CardDescription>
                Manage your uploaded videos and track their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading your videos...</div>
              ) : creatorVideos.length === 0 ? (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start creating content by uploading your first video!
                  </p>
                  <Button onClick={() => (document.querySelector('[value="upload"]') as HTMLElement)?.click()}>
                    Upload Your First Video
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {creatorVideos.map((video) => (
                    <Card key={video._id} className="overflow-hidden">
                      <div className="aspect-video bg-gray-100 relative">
                        {video.thumbnail && (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2 line-clamp-2">{video.title}</h4>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>{video.totalViews || 0} views</span>
                          <span>{video.priceDisplay}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {video.tags?.slice(0, 2).map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Video Tab */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-6 w-6" />
                Upload New Video
              </CardTitle>
              <CardDescription>
                Share your knowledge with the Dektrix community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Video File Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Video File *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          {videoFile ? videoFile.name : 'Click to upload video file'}
                        </p>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileChange}
                          className="hidden"
                          id="video-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('video-upload')?.click()}
                        >
                          Choose Video File
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Thumbnail *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          {thumbnailFile ? thumbnailFile.name : 'Click to upload thumbnail image'}
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailFileChange}
                          className="hidden"
                          id="thumbnail-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('thumbnail-upload')?.click()}
                        >
                          Choose Thumbnail
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter video title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter video description"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category and Difficulty */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="AI Agents">AI Agents</SelectItem>
                              <SelectItem value="DeFi">DeFi</SelectItem>
                              <SelectItem value="Blockchain">Blockchain</SelectItem>
                              <SelectItem value="NFTs">NFTs</SelectItem>
                              <SelectItem value="Web3">Web3</SelectItem>
                              <SelectItem value="Crypto">Crypto</SelectItem>
                              <SelectItem value="Smart Contracts">Smart Contracts</SelectItem>
                              <SelectItem value="DAOs">DAOs</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Price */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (in USDC) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priceDisplay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price Display *</FormLabel>
                          <FormControl>
                            <Input placeholder="$0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Duration */}
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (seconds) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="60"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Video duration in seconds (max 300 seconds / 5 minutes)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} variant="outline">
                        Add Tag
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch('tags').map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Featured Toggle */}
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Featured Video</FormLabel>
                          <FormDescription>
                            Mark this video as featured to highlight it on the homepage
                          </FormDescription>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Video'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your creator profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileEditForm creator={creator} onUpdate={setCreator} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Profile Edit Form Component
const ProfileEditForm: React.FC<{ creator: ICreator | null; onUpdate: (creator: ICreator) => void }> = ({ creator, onUpdate }) => {
  const { user } = useBaseWallet();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const profileSchema = z.object({
    username: z.string().min(1, 'Username is required').max(50, 'Username must be less than 50 characters'),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    profile_image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    socialLinks: z.object({
      twitter: z.string().url('Must be a valid URL').optional().or(z.literal('')),
      instagram: z.string().url('Must be a valid URL').optional().or(z.literal('')),
      youtube: z.string().url('Must be a valid URL').optional().or(z.literal('')),
      website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    }).optional(),
  });

  type ProfileForm = z.infer<typeof profileSchema>;

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: creator?.username || '',
      bio: creator?.bio || '',
      profile_image_url: creator?.profile_image_url || '',
      socialLinks: {
        twitter: creator?.socialLinks?.twitter || '',
        instagram: creator?.socialLinks?.instagram || '',
        youtube: creator?.socialLinks?.youtube || '',
        website: creator?.socialLinks?.website || '',
      },
    },
  });

  // Update form when creator data changes
  useEffect(() => {
    if (creator) {
      form.reset({
        username: creator.username || '',
        bio: creator.bio || '',
        profile_image_url: creator.profile_image_url || '',
        socialLinks: {
          twitter: creator.socialLinks?.twitter || '',
          instagram: creator.socialLinks?.instagram || '',
          youtube: creator.socialLinks?.youtube || '',
          website: creator.socialLinks?.website || '',
        },
      });
    }
  }, [creator, form]);

  const onSubmit = async (data: ProfileForm) => {
    if (!user?.walletAddress || !creator) return;

    try {
      setIsUpdating(true);

      const result = await updateCreator(user.walletAddress, {
        username: data.username,
        bio: data.bio || undefined,
        profile_image_url: data.profile_image_url || undefined,
        socialLinks: {
          twitter: data.socialLinks?.twitter || undefined,
          instagram: data.socialLinks?.instagram || undefined,
          youtube: data.socialLinks?.youtube || undefined,
          website: data.socialLinks?.website || undefined,
        },
      });

      onUpdate(result.creator);

      toast({
        title: 'Profile updated',
        description: 'Your creator profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!creator) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Username */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username *</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bio */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description about yourself and your content
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Profile Image URL */}
        <FormField
          control={form.control}
          name="profile_image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/your-image.jpg" {...field} />
              </FormControl>
              <FormDescription>
                URL to your profile image
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Social Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Social Links</h3>

          <FormField
            control={form.control}
            name="socialLinks.twitter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Twitter</FormLabel>
                <FormControl>
                  <Input placeholder="https://twitter.com/yourusername" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialLinks.instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram</FormLabel>
                <FormControl>
                  <Input placeholder="https://instagram.com/yourusername" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialLinks.youtube"
            render={({ field }) => (
              <FormItem>
                <FormLabel>YouTube</FormLabel>
                <FormControl>
                  <Input placeholder="https://youtube.com/c/yourchannel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialLinks.website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://yourwebsite.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Creator Stats (Read-only) */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold">Creator Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Earned:</span> ${creator.total_earned_usdc.toFixed(2)} USDC
            </div>
            <div>
              <span className="font-medium">Joined:</span> {new Date(creator.joined_at).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Total Views:</span> {creator.totalViews.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Followers:</span> {creator.followerCount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Update Profile'}
        </Button>
      </form>
    </Form>
  );
};

export default CreatorProfile;