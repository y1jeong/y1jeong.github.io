// Hybrid API service that switches between backend API and static API
// based on deployment environment

import { CONFIG, isStaticDeployment, canUseFeature } from '../config/deployment';
import { staticApi } from '../services/staticApi';
import { authApi, designsApi, imagesApi, perforationsApi, exportApi } from './api';
import type {
  ApiResponse,
  User,
  LoginCredentials,
  RegisterData,
  Design,
  ImageData,
  ImageAnalysis,
  ExportSettings,
  ExportResult
} from '@/types';

// Hybrid Auth API
export const hybridAuthApi = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string; refreshToken: string }>> {
    if (isStaticDeployment()) {
      // In static mode, create a mock user session
      const mockUser: User = {
        id: 'static-user',
        email: credentials.email,
        firstName: 'Static',
        lastName: 'User',
        roles: ['user'],
        isActive: true,
        isVerified: true,
        preferences: {
          units: 'mm',
          defaultPanelSize: { width: 1000, height: 1000 },
          defaultPerforation: {
            minSize: 5,
            maxSize: 20,
            shape: 'circle',
            pattern: 'grid',
            spacing: { horizontal: 10, diagonal: 10 }
          },
          theme: 'system',
          autoSave: true,
          showGrid: true,
          showRuler: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store mock session in localStorage
      localStorage.setItem('static-user-session', JSON.stringify(mockUser));
      
      return {
        success: true,
        message: 'Login successful',
        data: {
          user: mockUser,
          token: 'static-token',
          refreshToken: 'static-refresh-token'
        }
      };
    }
    
    return authApi.login(credentials);
  },

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string; refreshToken: string }>> {
    if (isStaticDeployment()) {
      // In static mode, create a mock user
      const mockUser: User = {
        id: 'static-user',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: ['user'],
        isActive: true,
        isVerified: true,
        preferences: {
          units: 'mm',
          defaultPanelSize: { width: 1000, height: 1000 },
          defaultPerforation: {
            minSize: 5,
            maxSize: 20,
            shape: 'circle',
            pattern: 'grid',
            spacing: { horizontal: 10, diagonal: 10 }
          },
          theme: 'system',
          autoSave: true,
          showGrid: true,
          showRuler: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      localStorage.setItem('static-user-session', JSON.stringify(mockUser));
      
      return {
        success: true,
        message: 'Registration successful',
        data: {
          user: mockUser,
          token: 'static-token',
          refreshToken: 'static-refresh-token'
        }
      };
    }
    
    return authApi.register(data);
  },

  async logout(): Promise<ApiResponse<void>> {
    if (isStaticDeployment()) {
      localStorage.removeItem('static-user-session');
      return { success: true, message: 'Logged out successfully', data: undefined };
    }
    
    return authApi.logout() as Promise<ApiResponse<void>>;
  },

  async getProfile(): Promise<ApiResponse<User>> {
    if (isStaticDeployment()) {
      const stored = localStorage.getItem('static-user-session');
      if (stored) {
        return {
          success: true,
          message: 'User profile retrieved successfully',
          data: JSON.parse(stored)
        };
      }
      throw new Error('No user session found');
    }
    
    return authApi.getProfile();
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    if (isStaticDeployment()) {
      const stored = localStorage.getItem('static-user-session');
      if (stored) {
        const user = { ...JSON.parse(stored), ...data, updatedAt: new Date().toISOString() };
        localStorage.setItem('static-user-session', JSON.stringify(user));
        return { success: true, message: 'Profile updated successfully', data: user };
      }
      throw new Error('No user session found');
    }
    
    return authApi.updateProfile(data);
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    if (isStaticDeployment()) {
      // In static mode, just return new mock tokens
      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: 'static-token-refreshed',
          refreshToken: 'static-refresh-token-refreshed'
        }
      };
    }
    
    return authApi.refreshToken(refreshToken);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    if (isStaticDeployment()) {
      // In static mode, just return success
      return {
        success: true,
        message: 'Password changed successfully',
        data: undefined
      };
    }
    
    return authApi.changePassword(currentPassword, newPassword) as Promise<ApiResponse<void>>;
  },

  async getAllUsers(): Promise<ApiResponse<{ users: User[]; statistics: any }>> {
    if (isStaticDeployment()) {
      // In static mode, return mock admin data
      const mockUsers: User[] = [
        {
          id: 'static-user',
          email: 'admin@example.com',
          firstName: 'Static',
          lastName: 'Admin',
          roles: ['admin'],
          isActive: true,
          isVerified: true,
          preferences: {
            units: 'mm',
            defaultPanelSize: { width: 1000, height: 1000 },
            defaultPerforation: {
              minSize: 5,
              maxSize: 20,
              shape: 'circle',
              pattern: 'grid',
              spacing: { horizontal: 10, diagonal: 10 }
            },
            theme: 'system',
            autoSave: true,
            showGrid: true,
            showRuler: true
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const mockStatistics = {
        total: 1,
        active: 1,
        verified: 1,
        admins: 1,
        recentSignups: 1
      };
      
      return {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: mockUsers,
          statistics: mockStatistics
        }
      };
    }
    
    return authApi.getAllUsers();
  },

  async promoteUser(userId: string): Promise<ApiResponse<User>> {
    if (isStaticDeployment()) {
      // In static mode, just return success
      return {
        success: true,
        message: 'User promoted successfully',
        data: {
          id: userId,
          email: 'user@example.com',
          firstName: 'Promoted',
          lastName: 'User',
          roles: ['admin'],
          isActive: true,
          isVerified: true,
          preferences: {
            units: 'mm',
            defaultPanelSize: { width: 1000, height: 1000 },
            defaultPerforation: {
              minSize: 5,
              maxSize: 20,
              shape: 'circle',
              pattern: 'grid',
              spacing: { horizontal: 10, diagonal: 10 }
            },
            theme: 'system',
            autoSave: true,
            showGrid: true,
            showRuler: true
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
    }
    
    return authApi.promoteUser(userId);
  },

  async demoteUser(userId: string): Promise<ApiResponse<User>> {
    if (isStaticDeployment()) {
      // In static mode, just return success
      return {
        success: true,
        message: 'User demoted successfully',
        data: {
          id: userId,
          email: 'user@example.com',
          firstName: 'Demoted',
          lastName: 'User',
          roles: ['user'],
          isActive: true,
          isVerified: true,
          preferences: {
            units: 'mm',
            defaultPanelSize: { width: 1000, height: 1000 },
            defaultPerforation: {
              minSize: 5,
              maxSize: 20,
              shape: 'circle',
              pattern: 'grid',
              spacing: { horizontal: 10, diagonal: 10 }
            },
            theme: 'system',
            autoSave: true,
            showGrid: true,
            showRuler: true
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
    }
    
    return authApi.demoteUser(userId);
  }
};

// Hybrid Design API
export const hybridDesignApi = {
  async getDesigns(params?: any): Promise<ApiResponse<Design[]>> {
    if (isStaticDeployment()) {
      const projects = await staticApi.getProjects();
      const designs: Design[] = projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        userId: 'static-user',
        panelSize: { width: 24, height: 24, units: 'inches' as const },
        perforationSettings: project.settings || {
          minSize: 0.1,
          maxSize: 1.0,
          shape: 'circle' as const,
          pattern: 'grid' as const,
          spacing: { horizontal: 1, diagonal: 1 },
          density: 0.5,
          distribution: 'uniform' as const
        },
        imageSettings: project.imageData ? {
          brightness: 0,
          contrast: 0,
          gamma: 1,
          blur: 0,
          invert: false,
          grayscale: false
        } : undefined,
        metadata: {
          views: 0,
          downloads: 0,
          likes: 0,
          totalPerforations: 0,
          totalArea: 0,
          perforationCoverage: 0
        },
        isPublic: false,
        tags: [],
        version: 1,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt)
      }));
      
      return { success: true, message: 'Designs retrieved successfully', data: designs };
    }
    
    // Handle the PaginatedResponse<Design> from designsApi.getAll
    const response = await designsApi.getAll(params);
    if (response.success && response.data) {
      return {
        success: true,
        message: 'Designs retrieved successfully',
        data: response.data.data // Extract the designs array from pagination
      };
    }
    return response as any;
  },

  async getDesign(id: string): Promise<ApiResponse<Design>> {
    if (isStaticDeployment()) {
      const project = await staticApi.getProject(id);
      if (!project) {
        throw new Error('Design not found');
      }
      
      const design: Design = {
        id: project.id,
        name: project.name,
        description: project.description,
        userId: 'static-user',
        panelSize: { width: 24, height: 24, units: 'inches' as const },
        perforationSettings: project.settings || {
          minSize: 0.1,
          maxSize: 1.0,
          shape: 'circle' as const,
          pattern: 'grid' as const,
          spacing: { horizontal: 1, diagonal: 1 },
          density: 0.5,
          distribution: 'uniform' as const
        },
        imageSettings: project.imageData ? {
          brightness: 0,
          contrast: 0,
          gamma: 1,
          blur: 0,
          invert: false,
          grayscale: false
        } : undefined,
        metadata: {
          views: 0,
          downloads: 0,
          likes: 0,
          totalPerforations: 0,
          totalArea: 0,
          perforationCoverage: 0
        },
        isPublic: false,
        tags: [],
        version: 1,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt)
      };
      
      return { success: true, message: 'Design retrieved successfully', data: design };
    }
    
    return designsApi.getById(id);
  },

  async createDesign(data: Partial<Design>): Promise<ApiResponse<Design>> {
    if (isStaticDeployment()) {
      const project = await staticApi.saveProject({
        name: data.name || 'Untitled Design',
        description: data.description || '',
        imageData: data.imageSettings ? 'url' : undefined,
        settings: data.perforationSettings
      });
      
      const design: Design = {
        id: project.id,
        name: project.name,
        description: project.description,
        userId: 'static-user',
        panelSize: { width: 24, height: 24, units: 'inches' as const },
        perforationSettings: project.settings || {
          minSize: 0.1,
          maxSize: 1.0,
          shape: 'circle' as const,
          pattern: 'grid' as const,
          spacing: { horizontal: 1, diagonal: 1 },
          density: 0.5,
          distribution: 'uniform' as const
        },
        imageSettings: project.imageData ? {
          brightness: 0,
          contrast: 0,
          gamma: 1,
          blur: 0,
          invert: false,
          grayscale: false
        } : undefined,
        metadata: {
          views: 0,
          downloads: 0,
          likes: 0,
          totalPerforations: 0,
          totalArea: 0,
          perforationCoverage: 0
        },
        isPublic: false,
        tags: [],
        version: 1,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt)
      };
      
      return { success: true, message: 'Design created successfully', data: design };
    }
    
    return designsApi.create(data as any);
  },

  async updateDesign(id: string, data: Partial<Design>): Promise<ApiResponse<Design>> {
    if (isStaticDeployment()) {
      const updates: any = {
        name: data.name,
        description: data.description,
        settings: data.perforationSettings
      };
      
      if (data.imageSettings) {
        updates.imageData = 'updated';
      }
      
      const project = await staticApi.updateProject(id, updates);
      
      const design: Design = {
        id: project.id,
        name: project.name,
        description: project.description,
        userId: 'static-user',
        panelSize: { width: 24, height: 24, units: 'inches' as const },
        perforationSettings: project.settings || {
          minSize: 0.1,
          maxSize: 1.0,
          shape: 'circle' as const,
          pattern: 'grid' as const,
          spacing: { horizontal: 1, diagonal: 1 },
          density: 0.5,
          distribution: 'uniform' as const
        },
        imageSettings: project.imageData ? {
          brightness: 0,
          contrast: 0,
          gamma: 1,
          blur: 0,
          invert: false,
          grayscale: false
        } : undefined,
        metadata: {
          views: 0,
          downloads: 0,
          likes: 0,
          totalPerforations: 0,
          totalArea: 0,
          perforationCoverage: 0
        },
        isPublic: false,
        tags: [],
        version: 1,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt)
      };
      
      return { success: true, message: 'Design updated successfully', data: design };
    }
    
    return designsApi.update(id, data);
  },

  async deleteDesign(id: string): Promise<ApiResponse<void>> {
    if (isStaticDeployment()) {
      await staticApi.deleteProject(id);
      return { success: true, message: 'Design deleted successfully', data: undefined };
    }
    
    const result = await designsApi.delete(id);
    return { success: result.success, message: 'Design deleted successfully', data: undefined };
  }
};

// Hybrid Image API
export const hybridImageApi = {
  async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<ImageData>> {
    if (isStaticDeployment()) {
      // Convert file to base64 for local storage
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const imageData: ImageData = {
            id: Date.now().toString(),
            filename: file.name,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            dimensions: {
              width: 0, // Will be set by image analysis
              height: 0 // Will be set by image analysis
            },
            url: reader.result as string,
            uploadedAt: new Date()
          };
          
          if (onProgress) onProgress(100);
          resolve({ success: true, message: 'Image uploaded successfully', data: imageData });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    }
    
    return imagesApi.upload(file, onProgress);
  },

  async analyzeImage(imageId: string): Promise<ApiResponse<ImageAnalysis>> {
    if (isStaticDeployment()) {
      // Mock image analysis for static deployment
      const mockAnalysis: ImageAnalysis = {
        histogram: {
          red: new Array(256).fill(0).map(() => Math.random() * 1000),
          green: new Array(256).fill(0).map(() => Math.random() * 1000),
          blue: new Array(256).fill(0).map(() => Math.random() * 1000),
          gray: new Array(256).fill(0).map(() => Math.random() * 1000)
        },
        statistics: {
          mean: 128,
          median: 120,
          std: 45,
          min: 0,
          max: 255
        },
        contrast: 0.75,
        brightness: 128,
        complexity: 0.65,
        dominantColors: ['#808080', '#606060', '#404040'],
        grayscaleMap: []
      };
      
      return { success: true, message: 'Image analysis completed', data: mockAnalysis };
    }
    
    return imagesApi.getAnalysis(imageId);
  }
};

// Hybrid Export API
export const hybridExportApi = {
  async exportDesign(designId: string, settings: ExportSettings): Promise<ApiResponse<ExportResult>> {
    if (isStaticDeployment()) {
      const project = await staticApi.getProject(designId);
      if (!project) {
        throw new Error('Design not found');
      }
      
      try {
        const blob = await staticApi.exportProject(project, settings.format as any);
        const url = URL.createObjectURL(blob);
        
        const result: ExportResult = {
          id: Date.now().toString(),
          filename: `${project.name}.${settings.format}`,
          format: settings.format,
          size: blob.size,
          downloadUrl: url,
          settings,
          statistics: {
            panelArea: 0,
            perforationCount: 0,
            fileSize: blob.size,
            generationTime: 0
          },
          generatedAt: new Date()
        };
        
        return { success: true, message: 'Export generated successfully', data: result };
      } catch (error) {
        throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return exportApi.generate({
      format: settings.format,
      panelDimensions: { width: 0, height: 0, units: 'inches' }, // This would need to come from the design
      perforations: [], // This would need to come from the design
      settings
    });
  }
};

// Feature availability helpers
export const getAvailableFeatures = () => {
  return {
    userAuthentication: canUseFeature('USER_AUTHENTICATION'),
    cloudStorage: canUseFeature('CLOUD_STORAGE'),
    realTimeCollaboration: canUseFeature('REAL_TIME_COLLABORATION'),
    advancedAnalytics: canUseFeature('ADVANCED_ANALYTICS'),
    fileUploadToServer: canUseFeature('FILE_UPLOAD_TO_SERVER')
  };
};

// Export deployment info
export const getDeploymentInfo = () => {
  return {
    isStatic: isStaticDeployment(),
    config: CONFIG,
    features: getAvailableFeatures()
  };
};

// Main hybrid API object
export const hybridApi = {
  auth: hybridAuthApi,
  designs: hybridDesignApi,
  images: hybridImageApi,
  export: hybridExportApi,
  
  // Fallback to original APIs for features not yet hybridized
  perforations: perforationsApi,
  
  // Utility methods
  getAvailableFeatures,
  getDeploymentInfo,
  isStaticMode: isStaticDeployment
};

export default hybridApi;

// Export individual APIs for compatibility
export { apiClient } from './api';
export { queryKeys } from './api';
export { authApi as originalAuthApi } from './api';

// Export hybrid auth API as authApi
// Note: Commented out to avoid declaration merging conflict
// export const authApi = hybridAuthApi;