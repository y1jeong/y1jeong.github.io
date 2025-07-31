import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, apiClient, queryKeys } from '@/lib/api';
import type { User, AuthState, LoginCredentials, RegisterData } from '@/types';

// Auth Context Types
interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  
  // Utilities
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

// Auth Actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string; refreshToken: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// Initial State
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    default:
      return state;
  }
};

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Token Management
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const getStoredRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

const getStoredUser = (): User | null => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

const setStoredAuth = (user: User, token: string, refreshToken: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    apiClient.setToken(token);
  } catch (error) {
    console.error('Failed to store auth data:', error);
  }
};

const clearStoredAuth = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    apiClient.setToken(null);
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
};

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getStoredToken();
      const refreshToken = getStoredRefreshToken();
      const user = getStoredUser();

      if (token && refreshToken && user) {
        apiClient.setToken(token);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token, refreshToken },
        });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!state.token || !state.refreshToken) return;

    const refreshInterval = setInterval(async () => {
      try {
        const response = await authApi.refreshToken(state.refreshToken!);
        if (response.success && response.data) {
          const { token, refreshToken } = response.data;
          setStoredAuth(state.user!, token, refreshToken);
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: state.user!, token, refreshToken },
          });
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        handleLogout();
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes

    return () => clearInterval(refreshInterval);
  }, [state.token, state.refreshToken, state.user]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onMutate: () => {
      dispatch({ type: 'AUTH_START' });
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        setStoredAuth(user, token, refreshToken);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token, refreshToken },
        });
      }
    },
    onError: (error) => {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Login failed',
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onMutate: () => {
      dispatch({ type: 'AUTH_START' });
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        setStoredAuth(user, token, refreshToken);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token, refreshToken },
        });
      }
    },
    onError: (error) => {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Registration failed',
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (response) => {
      if (response.success && response.data) {
        const updatedUser = response.data;
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
      }
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(currentPassword, newPassword),
  });

  // Logout function
  const handleLogout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearStoredAuth();
      dispatch({ type: 'AUTH_LOGOUT' });
      queryClient.clear();
    }
  };

  // Refresh token function
  const handleRefreshToken = async (): Promise<void> => {
    if (!state.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authApi.refreshToken(state.refreshToken);
      if (response.success && response.data) {
        const { token, refreshToken } = response.data;
        setStoredAuth(state.user!, token, refreshToken);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: state.user!, token, refreshToken },
        });
      }
    } catch (error) {
      handleLogout();
      throw error;
    }
  };

  // Permission helpers
  const hasRole = (role: string): boolean => {
    return state.user?.roles.includes(role as any) || false;
  };

  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;
    
    // Admin has all permissions
    if (hasRole('admin')) return true;
    
    // Define permission mappings
    const permissionMap: Record<string, string[]> = {
      'designs.create': ['user', 'premium', 'admin'],
      'designs.edit': ['user', 'premium', 'admin'],
      'designs.delete': ['user', 'premium', 'admin'],
      'designs.publish': ['premium', 'admin'],
      'designs.export': ['user', 'premium', 'admin'],
      'designs.advanced_export': ['premium', 'admin'],
      'images.upload': ['user', 'premium', 'admin'],
      'images.process': ['user', 'premium', 'admin'],
      'perforations.advanced': ['premium', 'admin'],
      'admin.users': ['admin'],
      'admin.system': ['admin'],
    };
    
    const allowedRoles = permissionMap[permission] || [];
    return state.user.roles.some(role => allowedRoles.includes(role));
  };

  // Context value
  const contextValue: AuthContextType = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading || loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error?.message || registerMutation.error?.message || null,
    
    // Actions
    login: async (credentials: LoginCredentials) => {
      await loginMutation.mutateAsync(credentials);
    },
    register: async (data: RegisterData) => {
      await registerMutation.mutateAsync(data);
    },
    logout: handleLogout,
    refreshToken: handleRefreshToken,
    updateProfile: async (data: Partial<User>) => {
      await updateProfileMutation.mutateAsync(data);
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
    },
    clearError: () => {
      dispatch({ type: 'CLEAR_ERROR' });
      loginMutation.reset();
      registerMutation.reset();
    },
    
    // Utilities
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to access this page.
            </p>
            <a 
              href="/auth/login" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Go to Login
            </a>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

// Hook for role-based access
export const useRequireRole = (role: string): boolean => {
  const { hasRole, isAuthenticated } = useAuth();
  return isAuthenticated && hasRole(role);
};

// Hook for permission-based access
export const useRequirePermission = (permission: string): boolean => {
  const { hasPermission, isAuthenticated } = useAuth();
  return isAuthenticated && hasPermission(permission);
};

export default AuthContext;