import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import mongoose from 'mongoose';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Video, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const AdminUpload: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
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
        creator: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), // In a real app, this would be the current user's ID
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Upload New Video
          </CardTitle>
          <CardDescription>
            Add a new educational video to the Dektirk platform
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
    </div>
  );
};

export default AdminUpload;