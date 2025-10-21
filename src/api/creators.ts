import { ICreator } from '@/models/Creator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface CreateCreatorData {
  wallet_address: string;
  username: string;
  bio?: string;
  profile_image_url?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
}

export interface UpdateCreatorData {
  username?: string;
  bio?: string;
  profile_image_url?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
}

export interface CreatorResponse {
  creator: ICreator;
}

export interface CreatorsResponse {
  creators: ICreator[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Get all creators with pagination
export async function getCreators(page: number = 1, limit: number = 20): Promise<CreatorsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/creators?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch creators: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching creators:', error);
    throw error;
  }
}

// Get top earning creators
export async function getTopEarners(limit: number = 10): Promise<CreatorsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/creators?top_earners=true&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch top earners: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching top earners:', error);
    throw error;
  }
}

// Get creator by wallet address
export async function getCreatorByWallet(walletAddress: string): Promise<CreatorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/creators/${walletAddress}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Creator not found');
      }
      throw new Error(`Failed to fetch creator: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching creator by wallet:', error);
    throw error;
  }
}

// Get creator by username
export async function getCreatorByUsername(username: string): Promise<CreatorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/creators?username=${username}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Creator not found');
      }
      throw new Error(`Failed to fetch creator: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching creator by username:', error);
    throw error;
  }
}

// Create new creator
export async function createCreator(creatorData: CreateCreatorData): Promise<CreatorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/creators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(creatorData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create creator: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating creator:', error);
    throw error;
  }
}

// Update creator
export async function updateCreator(walletAddress: string, updateData: UpdateCreatorData): Promise<CreatorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/creators/${walletAddress}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update creator: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating creator:', error);
    throw error;
  }
}

// Update creator earnings (internal use)
export async function updateCreatorEarnings(walletAddress: string, amount: number): Promise<CreatorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/creators/${walletAddress}/earnings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update earnings: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating creator earnings:', error);
    throw error;
  }
}

// Delete creator (soft delete)
export async function deleteCreator(walletAddress: string): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/creators/${walletAddress}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete creator: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting creator:', error);
    throw error;
  }
}

// Check if creator exists by wallet address
export async function creatorExists(walletAddress: string): Promise<boolean> {
  try {
    await getCreatorByWallet(walletAddress);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message === 'Creator not found') {
      return false;
    }
    throw error;
  }
}

// Get or create creator (useful for first-time users)
export async function getOrCreateCreator(walletAddress: string, username: string, bio?: string): Promise<CreatorResponse> {
  try {
    // Try to get existing creator
    return await getCreatorByWallet(walletAddress);
  } catch (error) {
    if (error instanceof Error && error.message === 'Creator not found') {
      // Create new creator if not found
      return await createCreator({
        wallet_address: walletAddress,
        username,
        bio
      });
    }
    throw error;
  }
}