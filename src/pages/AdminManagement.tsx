import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Video, FolderOpen, ArrowRight } from 'lucide-react';

interface Video {
  _id: string;
  title: string;
  category: string;
  difficulty: string;
  duration: number;
  tags: string[];
  isActive: boolean;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  videoCount: number;
}

const AdminManagement: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadVideos();
    loadCategories();
  }, []);

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/videos');
      const data = await response.json();
      if (data.success) {
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load videos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { getCategories } = await import('@/api/categories');
      const result = await getCategories();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    }
  };

  const handleAddVideoToCategory = async () => {
    if (!selectedVideo || !selectedCategory) {
      toast({
        title: 'Missing Selection',
        description: 'Please select both a video and a category',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdating(true);
      const { addVideoToCategory } = await import('@/api/categories');

      const result = await addVideoToCategory(selectedVideo, selectedCategory);

      if (result.success) {
        toast({
          title: 'Success!',
          description: `Video "${result.data.video.title}" has been moved to category "${result.data.newCategory}"`,
        });

        // Reload data to reflect changes
        await loadVideos();
        await loadCategories();

        // Reset selections
        setSelectedVideo('');
        setSelectedCategory('');
      } else {
        throw new Error(result.error || 'Failed to update video category');
      }
    } catch (error) {
      console.error('Error updating video category:', error);
      toast({
        title: 'Update Failed',
        description: 'There was an error updating the video category. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getSelectedVideoDetails = () => {
    return videos.find(video => video._id === selectedVideo);
  };

  const getSelectedCategoryDetails = () => {
    return categories.find(category => category.slug === selectedCategory);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Admin Management
          </CardTitle>
          <CardDescription>
            Manage videos and categories on the Dektirk platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Video Category Management Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Move Video to Category
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Video Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Select Video</label>
                <Select value={selectedVideo} onValueChange={setSelectedVideo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a video..." />
                  </SelectTrigger>
                  <SelectContent>
                    {videos.map((video) => (
                      <SelectItem key={video._id} value={video._id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{video.title}</span>
                          <span className="text-xs text-gray-500">
                            Current: {video.category} • {video.difficulty}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selected Video Details */}
                {selectedVideo && getSelectedVideoDetails() && (
                  <Card className="p-3 bg-blue-50">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span className="font-medium">{getSelectedVideoDetails()?.title}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">{getSelectedVideoDetails()?.category}</Badge>
                        <Badge variant="outline">{getSelectedVideoDetails()?.difficulty}</Badge>
                        <Badge variant="outline">{getSelectedVideoDetails()?.duration}s</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {getSelectedVideoDetails()?.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Category Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Target Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose target category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        <div className="flex flex-col">
                          <span className="font-medium">{category.name}</span>
                          <span className="text-xs text-gray-500">
                            {category.videoCount} videos • {category.slug}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selected Category Details */}
                {selectedCategory && getSelectedCategoryDetails() && (
                  <Card className="p-3 bg-green-50">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        <span className="font-medium">{getSelectedCategoryDetails()?.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {getSelectedCategoryDetails()?.description}
                      </p>
                      <Badge variant="outline">
                        {getSelectedCategoryDetails()?.videoCount} videos
                      </Badge>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleAddVideoToCategory}
                disabled={!selectedVideo || !selectedCategory || isUpdating}
                className="flex items-center gap-2"
                size="lg"
              >
                {isUpdating ? (
                  'Updating...'
                ) : (
                  <>
                    Move Video <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Platform Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{videos.length}</div>
                  <div className="text-sm text-gray-600">Total Videos</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{categories.length}</div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {videos.filter(v => v.isActive).length}
                  </div>
                  <div className="text-sm text-gray-600">Active Videos</div>
                </div>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManagement;