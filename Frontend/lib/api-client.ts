import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export type ItemStatus = 
  | 'PENDING_DOWNLOAD' 
  | 'MEDIA_STORED' 
  | 'TRANSCRIBING' 
  | 'ENRICHING' 
  | 'COMPLETED'
  | 'READY' 
  | 'ERROR' 
  | 'ENRICH_ERROR';

export type ItemType = 'recipe' | 'workout' | 'pending' | 'other' | 'UNKNOWN';

export interface WellnessItem {
  itemId: string;
  userId: string;
  type: ItemType;
  status: ItemStatus;
  sourceUrl: string;
  title?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  transcript?: string;
  transcriptPreview?: string;
  isFavorite?: boolean;
  enrichedData?: {
    recipe?: {
      name: string;
      ingredients: Array<{ item: string; quantity?: string }>;
      steps: string[];
      time_minutes?: number;
      servings?: number;
      difficulty?: string;
    };
    workout?: {
      name: string;
      duration_minutes?: number;
      level?: string;
      focus?: string[];
      blocks: Array<{
        exercise: string;
        reps?: string;
        sets?: number;
        notes?: string;
      }>;
    };
    pending?: {
      category: 'movie' | 'book' | 'course' | 'other';
      name: string;
      platform?: string;
      notes?: string;
    };
  };
  errorMessage?: string;
}

export interface IngestResponse {
  itemId: string;
  status: ItemStatus;
}

class ApiClient {
  private async getAuthToken(): Promise<string> {
    try {
      console.log('🔐 Fetching auth session...');
      // Force refresh to ensure we get a valid token
      const session = await fetchAuthSession({ forceRefresh: false });
      console.log('📋 Session:', {
        hasTokens: !!session.tokens,
        hasIdToken: !!session.tokens?.idToken,
        hasAccessToken: !!session.tokens?.accessToken,
      });
      
      // Use accessToken for API Gateway JWT Authorizer
      const token = session.tokens?.accessToken?.toString();
      
      if (!token) {
        console.error('❌ No authentication token available');
        console.error('Session details:', JSON.stringify(session, null, 2));
        throw new Error('No authentication token available');
      }
      
      console.log('✅ Access Token obtained, length:', token.length);
      // Log first and last 20 characters for debugging
      console.log('Token preview:', token.substring(0, 20) + '...' + token.substring(token.length - 20));
      return token;
    } catch (error) {
      console.error('❌ Failed to get auth token:', error);
      throw new Error('Authentication required');
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const url = `${API_BASE_URL}${path}`;
    
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    };
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    console.log('📨 Request Headers:', {
      'Content-Type': headers['Content-Type'],
      'Authorization': `Bearer ${token.substring(0, 20)}...${token.substring(token.length - 20)}`
    });
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status}`, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ API Response:`, data);
    
    return data as T;
  }

  // POST /items/ingest
  async ingestTikTok(url: string): Promise<IngestResponse> {
    return this.request<IngestResponse>('/items/ingest', {
      method: 'POST',
      body: JSON.stringify({ sourceUrl: url }),
    });
  }

  // GET /items?type=&status=
  async getItems(filters?: {
    type?: ItemType;
    status?: ItemStatus;
  }): Promise<WellnessItem[]> {
    const params = new URLSearchParams();
    
    if (filters?.type) {
      params.append('type', filters.type);
    }
    
    if (filters?.status) {
      params.append('status', filters.status);
    }
    
    const queryString = params.toString();
    const path = queryString ? `/items?${queryString}` : '/items';
    
    const response = await this.request<{ items: WellnessItem[]; count: number }>(path);
    return response.items || [];
  }

  // GET /items/{itemId}
  async getItem(itemId: string): Promise<WellnessItem> {
    return this.request<WellnessItem>(`/items/${itemId}`);
  }

  // PUT /items/{itemId}
  async updateItem(
    itemId: string,
    updates: {
      title?: string;
      tags?: string[];
      type?: ItemType;
      isFavorite?: boolean;
    }
  ): Promise<void> {
    await this.request<{ message: string; item: any }>(`/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ itemId, ...updates }),
    });
  }

  // DELETE /items/{itemId}
  async deleteItem(itemId: string): Promise<void> {
    await this.request<{ message: string; itemId: string }>(`/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Future: POST /items/{itemId}/reprocess
  async reprocessItem(itemId: string): Promise<IngestResponse> {
    return this.request<IngestResponse>(`/items/${itemId}/reprocess`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();
