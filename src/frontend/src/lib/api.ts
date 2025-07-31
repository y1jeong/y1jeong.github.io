import { QueryClient } from '@tanstack/react-query';
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  LoginCredentials,
  RegisterData,
  Design,
  ImageData,
  ImageAnalysis,
  ImageSettings,
  PerforationSettings,
  PanelDimensions,
  ExportSettings,
  ExportResult,
  DesignStatistics,
  Perforation
} from '@/types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_TIMEOUT = 30000; // 30 seconds

// Request interceptor for adding auth token
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.loadToken();
  }

  private loadToken(): void {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.setToken(null);
          window.location.href = '/auth/login';
          throw new Error('Authentication required');
        }
        
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        throw new Error(errorData.message || 'Request failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return this.request<T>(url.pathname + url.search);
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // File upload method
  async upload<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.open('POST', `${this.baseURL}${endpoint}`);
      xhr.timeout = this.timeout;
      
      if (this.token) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      }
      
      xhr.send(formData);
    });
  }
}

// Create API client instance
export const apiClient = new ApiClient();

// Authentication API
export const authApi = {
  login: (credentials: LoginCredentials) => 
    apiClient.post<{ user: User; token: string; refreshToken: string }>('/api/auth/login', credentials),
  
  register: (data: RegisterData) => 
    apiClient.post<{ user: User; token: string; refreshToken: string }>('/api/auth/register', data),
  
  logout: () => 
    apiClient.post('/api/auth/logout'),
  
  refreshToken: (refreshToken: string) => 
    apiClient.post<{ token: string; refreshToken: string }>('/api/auth/refresh', { refreshToken }),
  
  forgotPassword: (email: string) => 
    apiClient.post('/api/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) => 
    apiClient.post('/api/auth/reset-password', { token, password }),
  
  verifyEmail: (token: string) => 
    apiClient.post('/api/auth/verify-email', { token }),
  
  resendVerification: (email: string) => 
    apiClient.post('/api/auth/resend-verification', { email }),
  
  getProfile: () => 
    apiClient.get<User>('/api/auth/profile'),
  
  updateProfile: (data: Partial<User>) => 
    apiClient.put<User>('/api/auth/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) => 
    apiClient.post('/api/auth/change-password', { currentPassword, newPassword }),
  
  deleteAccount: () => 
    apiClient.delete('/api/auth/account'),

  // Admin functions
  getAllUsers: () => 
    apiClient.get<{ users: User[]; statistics: any }>('/api/auth/admin/users'),

  promoteUser: (userId: string) => 
    apiClient.put<User>(`/api/auth/admin/promote/${userId}`),

  demoteUser: (userId: string) => 
    apiClient.put<User>(`/api/auth/admin/demote/${userId}`)
};

// Images API
export const imagesApi = {
  upload: (file: File, onProgress?: (progress: number) => void) => 
    apiClient.upload<ImageData>('/api/images/upload', file, undefined, onProgress),
  
  process: (imageId: string, settings: ImageSettings) => 
    apiClient.post<ImageData>('/api/images/process', { imageId, settings }),
  
  getAnalysis: (imageId: string) => 
    apiClient.get<ImageAnalysis>(`/api/images/${imageId}/analysis`),
  
  getPreview: (imageId: string, settings?: Partial<ImageSettings>) => 
    apiClient.post<{ previewUrl: string }>(`/api/images/${imageId}/preview`, settings),
  
  delete: (imageId: string) => 
    apiClient.delete(`/api/images/${imageId}`),
  
  getFormats: () => 
    apiClient.get<{ formats: string[]; limits: Record<string, any> }>('/api/images/formats')
};

// Perforations API
export const perforationsApi = {
  generate: (params: {
    panelDimensions: PanelDimensions;
    settings: PerforationSettings;
    imageAnalysis?: ImageAnalysis;
  }) => 
    apiClient.post<{ perforations: Perforation[]; statistics: any }>('/api/perforations/generate', params),
  
  getShapes: () => 
    apiClient.get<Array<{ name: string; description: string; parameters: string[] }>>('/api/perforations/shapes'),
  
  getPatterns: () => 
    apiClient.get<Array<{ name: string; description: string; parameters: string[] }>>('/api/perforations/patterns'),
  
  calculate: (params: {
    panelDimensions: PanelDimensions;
    settings: PerforationSettings;
  }) => 
    apiClient.post<{ statistics: any }>('/api/perforations/calculate', params),
  
  getRecommendations: (params: {
    panelSize: PanelDimensions;
    imageCharacteristics?: { contrast: number; complexity: number };
  }) => 
    apiClient.get<{ recommendations: PerforationSettings }>('/api/perforations/recommendations', params)
};

// Designs API
export const designsApi = {
  create: (design: Omit<Design, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'metadata'>) => 
    apiClient.post<Design>('/api/designs', design),
  
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => 
    apiClient.get<PaginatedResponse<Design>>('/api/designs', params),
  
  getPublic: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => 
    apiClient.get<PaginatedResponse<Design>>('/api/designs/public', params),
  
  getById: (id: string) => 
    apiClient.get<Design>(`/api/designs/${id}`),
  
  update: (id: string, updates: Partial<Design>) => 
    apiClient.put<Design>(`/api/designs/${id}`, updates),
  
  delete: (id: string) => 
    apiClient.delete(`/api/designs/${id}`),
  
  duplicate: (id: string, name?: string) => 
    apiClient.post<Design>(`/api/designs/${id}/duplicate`, { name }),
  
  publish: (id: string) => 
    apiClient.post(`/api/designs/${id}/publish`),
  
  unpublish: (id: string) => 
    apiClient.post(`/api/designs/${id}/unpublish`),
  
  getVersions: (id: string) => 
    apiClient.get<Array<any>>(`/api/designs/${id}/versions`),
  
  getStatistics: () => 
    apiClient.get<DesignStatistics>('/api/designs/stats/summary')
};

// Export API
export const exportApi = {
  generate: (params: {
    format: string;
    panelDimensions: PanelDimensions;
    perforations: Perforation[];
    settings: ExportSettings;
  }) => 
    apiClient.post<ExportResult>('/api/export/generate', params),
  
  download: (format: string, filename: string) => {
    const url = `${API_BASE_URL}/api/export/download/${format}/${filename}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  
  getFormats: () => 
    apiClient.get<Array<{
      format: string;
      name: string;
      description: string;
      features: string[];
      limitations: string[];
      recommendedFor: string[];
      settings: Record<string, any>;
    }>>('/api/export/formats'),
  
  preview: (params: {
    panelDimensions: PanelDimensions;
    perforations: Perforation[];
    settings: ExportSettings;
  }) => 
    apiClient.post<{ previewUrl: string }>('/api/export/preview', params)
};

// Query Client Configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408 (timeout)
        if (error instanceof Error && error.message.includes('4')) {
          const status = parseInt(error.message.match(/\d+/)?.[0] || '0');
          if (status >= 400 && status < 500 && status !== 408) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query Keys
export const queryKeys = {
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  designs: {
    all: ['designs'] as const,
    list: (params?: any) => ['designs', 'list', params] as const,
    detail: (id: string) => ['designs', 'detail', id] as const,
    public: (params?: any) => ['designs', 'public', params] as const,
    statistics: ['designs', 'statistics'] as const,
    versions: (id: string) => ['designs', 'versions', id] as const,
  },
  images: {
    all: ['images'] as const,
    detail: (id: string) => ['images', 'detail', id] as const,
    analysis: (id: string) => ['images', 'analysis', id] as const,
    formats: ['images', 'formats'] as const,
  },
  perforations: {
    shapes: ['perforations', 'shapes'] as const,
    patterns: ['perforations', 'patterns'] as const,
    recommendations: (params: any) => ['perforations', 'recommendations', params] as const,
  },
  export: {
    formats: ['export', 'formats'] as const,
  },
} as const;

// Error handling utilities
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('timeout');
  }
  return false;
};

// Response validation utilities
export const validateResponse = <T>(response: ApiResponse<T>): T => {
  if (!response.success) {
    throw new Error(response.error || response.message || 'Request failed');
  }
  if (!response.data) {
    throw new Error('No data received');
  }
  return response.data;
};

// Cache utilities
export const invalidateQueries = (keys: string[]) => {
  keys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
};

export const prefetchQuery = async <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  staleTime?: number
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: staleTime || 5 * 60 * 1000,
  });
};

// Export the API client for direct use
export default apiClient;