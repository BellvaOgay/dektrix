import connectDB from '../lib/database';
import Category from '../models/Category';
import Video from '../models/Video';
import type { ICategory } from '../models/Category';

// Get all categories
export async function getCategories(filters?: {
  active?: boolean;
  featured?: boolean;
}) {
  try {
    await connectDB();

    const query: any = {};

    if (filters?.active !== undefined) {
      query.isActive = filters.active;
    }

    if (filters?.featured !== undefined) {
      query.featured = filters.featured;
    }

    const categories = await (Category as any).find(query)
      .sort({ featured: -1, order: 1, name: 1 })
      .lean();

    return {
      success: true,
      data: categories
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      success: false,
      error: 'Failed to fetch categories'
    };
  }
}

// Get category by slug
export async function getCategoryBySlug(slug: string) {
  try {
    await connectDB();

    const category = await (Category as any).findOne({ slug, isActive: true }).lean();

    if (!category) {
      return {
        success: false,
        error: 'Category not found'
      };
    }

    return {
      success: true,
      data: category
    };
  } catch (error) {
    console.error('Error fetching category:', error);
    return {
      success: false,
      error: 'Failed to fetch category'
    };
  }
}

// Create a new category
export async function createCategory(categoryData: Partial<ICategory>) {
  try {
    await connectDB();

    // Generate slug from name if not provided
    if (!categoryData.slug && categoryData.name) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const category = new Category(categoryData);
    await category.save();

    return {
      success: true,
      data: category
    };
  } catch (error) {
    console.error('Error creating category:', error);
    return {
      success: false,
      error: 'Failed to create category'
    };
  }
}

// Update category
export async function updateCategory(categoryId: string, updates: Partial<ICategory>) {
  try {
    await connectDB();

    const category = await (Category as any).findByIdAndUpdate(
      categoryId,
      updates,
      { new: true, runValidators: true }
    ).lean();

    if (!category) {
      return {
        success: false,
        error: 'Category not found'
      };
    }

    return {
      success: true,
      data: category
    };
  } catch (error) {
    console.error('Error updating category:', error);
    return {
      success: false,
      error: 'Failed to update category'
    };
  }
}

// Add video to category
export async function addVideoToCategory(videoId: string, categorySlug: string) {
  try {
    await connectDB();

    // Check if video exists
    const video = await (Video as any).findById(videoId);
    if (!video) {
      return {
        success: false,
        error: 'Video not found'
      };
    }

    // Check if category exists
    const category = await (Category as any).findOne({ slug: categorySlug, isActive: true });
    if (!category) {
      return {
        success: false,
        error: 'Category not found or inactive'
      };
    }

    // Get the old category for count updates
    const oldCategorySlug = video.category;

    // Update video's category
    const updatedVideo = await (Video as any).findByIdAndUpdate(
      videoId,
      { category: categorySlug },
      { new: true, runValidators: true }
    ).populate('creator', 'username displayName avatar');

    // Update video counts for both old and new categories
    if (oldCategorySlug && oldCategorySlug !== categorySlug) {
      // Decrease count for old category
      const oldVideoCount = await (Video as any).countDocuments({
        category: oldCategorySlug,
        isActive: true
      });
      await (Category as any).findOneAndUpdate(
        { slug: oldCategorySlug },
        { videoCount: oldVideoCount }
      );
    }

    // Update count for new category
    const newVideoCount = await (Video as any).countDocuments({
      category: categorySlug,
      isActive: true
    });
    await (Category as any).findOneAndUpdate(
      { slug: categorySlug },
      { videoCount: newVideoCount }
    );

    return {
      success: true,
      message: 'Video successfully added to category',
      data: {
        video: updatedVideo,
        oldCategory: oldCategorySlug,
        newCategory: categorySlug
      }
    };

  } catch (error) {
    console.error('Error adding video to category:', error);
    return {
      success: false,
      error: 'Failed to add video to category'
    };
  }
}

// Update video counts for all categories
export async function updateCategoryCounts() {
  try {
    await connectDB();

    const categories = await (Category as any).find().lean();

    for (const category of categories) {
      const videoCount = await Video.countDocuments({
        category: category.slug,
        isActive: true
      });

      await (Category as any).findByIdAndUpdate(category._id, {
        videoCount
      });
    }

    return {
      success: true,
      message: 'Category counts updated successfully'
    };
  } catch (error) {
    console.error('Error updating category counts:', error);
    return {
      success: false,
      error: 'Failed to update category counts'
    };
  }
}

// Get videos by category
export async function getVideosByCategory(slug: string, options?: {
  limit?: number;
  skip?: number;
  featured?: boolean;
}) {
  try {
    await connectDB();

    const query: any = {
      category: slug,
      isActive: true
    };

    if (options?.featured !== undefined) {
      query.featured = options.featured;
    }

    const videos = await (Video as any).find(query)
      .populate('creator', 'username displayName avatar')
      .sort({ featured: -1, createdAt: -1 })
      .limit(options?.limit || 20)
      .skip(options?.skip || 0)
      .lean();

    return {
      success: true,
      data: videos
    };
  } catch (error) {
    console.error('Error fetching videos by category:', error);
    return {
      success: false,
      error: 'Failed to fetch videos'
    };
  }
}