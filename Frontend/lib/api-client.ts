import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export type ItemStatus = 
  | 'PENDING_DOWNLOAD' 
  | 'MEDIA_STORED' 
  | 'TRANSCRIBING' 
  | 'ENRICHING' 
  | 'READY' 
  | 'ERROR' 
  | 'ENRICH_ERROR';

export type ItemType = 'recipe' | 'workout' | 'pending' | 'other';

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
  transcriptPreview?: string;
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
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      return token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw new Error('Authentication required');
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const url = `${API_BASE_URL}${path}`;
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
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
      body: JSON.stringify({ url }),
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
    
    return this.request<WellnessItem[]>(path);
  }

  // GET /items/{itemId}
  async getItem(itemId: string): Promise<WellnessItem> {
    return this.request<WellnessItem>(`/items/${itemId}`);
  }

  // Future: PATCH /items/{itemId}
  async updateItem(
    itemId: string,
    updates: Partial<Pick<WellnessItem, 'title' | 'tags' | 'enrichedData'>>
  ): Promise<WellnessItem> {
    return this.request<WellnessItem>(`/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
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
