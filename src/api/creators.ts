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
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json?.error || `Failed to fetch creators: ${response.statusText}`);
    }
    // Normalize list response shape
    const creators = (json?.data as ICreator[]) || (json?.creators as ICreator[]) || [];
    const pagination = json?.pagination;
    return { creators, pagination };
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
  const urlQuery = `${API_BASE_URL}/api/creators?wallet_address=${walletAddress}`;
  const urlPath = `${API_BASE_URL}/api/creators/${walletAddress}`; // fallback for local server.cjs

  // Try query-param route first (Vercel serverless)
  try {
    const response = await fetch(urlQuery);
    const json = await response.json();
    if (response.ok) {
      const creator = (json?.data as ICreator) || (json?.creator as ICreator) || (json as ICreator);
      return { creator };
    }
    // Explicit 404 from API
    if (response.status === 404) {
      throw new Error(json?.error || 'Creator not found');
    }
    // If route not found or other error, fall through to path fallback
  } catch (err) {
    // Continue to fallback
  }

  // Fallback: path-parameter route (local Express server)
  const resp2 = await fetch(urlPath);
  const json2 = await resp2.json().catch(() => ({}));
  if (resp2.ok) {
    const creator = (json2?.data as ICreator) || (json2?.creator as ICreator) || (json2 as ICreator);
    return { creator };
  }
  if (resp2.status === 404) {
    throw new Error(json2?.error || 'Creator not found');
  }
  throw new Error(json2?.error || `Failed to fetch creator: ${resp2.statusText}`);
}

// Get creator by username
export async function getCreatorByUsername(username: string): Promise<CreatorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/creators?username=${username}`);
    const json = await response.json();
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(json?.error || 'Creator not found');
      }
      throw new Error(json?.error || `Failed to fetch creator: ${response.statusText}`);
    }
    const creator = (json?.data as ICreator) || (json?.creator as ICreator) || (json as ICreator);
    return { creator };
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
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json?.error || `Failed to create creator: ${response.statusText}`);
    }
    const creator = (json?.data as ICreator) || (json?.creator as ICreator) || (json as ICreator);
    return { creator };
  } catch (error) {
    console.error('Error creating creator:', error);
    throw error;
  }
}

// Update creator
export async function updateCreator(walletAddress: string, updateData: UpdateCreatorData): Promise<CreatorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/creators?wallet_address=${walletAddress}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json?.error || `Failed to update creator: ${response.statusText}`);
    }
    const creator = (json?.data as ICreator) || (json?.creator as ICreator) || (json as ICreator);
    return { creator };
  } catch (error) {
    console.error('Error updating creator:', error);
    throw error;
  }
}

// Update creator earnings (internal use)
export async function updateCreatorEarnings(walletAddress: string, amount: number): Promise<CreatorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/creators/earnings?wallet_address=${walletAddress}`, {
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
    const response = await fetch(`${API_BASE_URL}/api/creators?wallet_address=${walletAddress}`, {
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