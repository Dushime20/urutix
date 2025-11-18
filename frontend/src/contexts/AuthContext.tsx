import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { identifyUser, resetUser, captureEvent } from '../utils/posthog';
import { authAPI } from '../services/api';
import { getApiBaseUrl } from '../config/environment';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  tenantName?: string;
  status?: string;
  emailVerifiedAt?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User | null>;
  register: (userData: RegisterData) => Promise<User | null>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
  isLoading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  userType?: 'CARGO_OWNER' | 'TRUCK_OWNER';
  tenantId?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function declaration for useAuth (Fast Refresh compatible)
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Function declaration for AuthProvider (Fast Refresh compatible)
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser) as User;
      } catch {
        localStorage.removeItem('user');
      }
    }
    return null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // Add flag to prevent infinite loop

  const persistUser = (userData: User | null) => {
    if (userData) {
      // Set React state
      setUser(userData);
      // Persist to localStorage safely
      try {
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Failed to persist user in localStorage:', error);
      }
      // Persist tenantId for multi-tenant headers
      if (userData.tenantId) {
        localStorage.setItem('tenantId', userData.tenantId);
      } else {
        localStorage.removeItem('tenantId');
      }
    } else {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('tenantId');
    }
  };

  const clearInvalidTokens = () => {
    console.log('Clearing invalid tokens...');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setRefreshToken(null);
    persistUser(null);
    setIsRefreshing(false);
    delete axios.defaults.headers.common['Authorization'];
    toast.error('Session expired. Please login again.');
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshToken || isRefreshing) {
      console.log('Refresh token not available or already refreshing');
      return false;
    }

    try {
      setIsRefreshing(true);
      console.log('Attempting to refresh access token...');
      
      // Use the same base URL configuration as the API service
      const baseURL = getApiBaseUrl() || 'http://localhost:3000/api';
      const response = await axios.post(`${baseURL}/auth/refresh`, {
        refreshToken,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

      if (newAccessToken && newRefreshToken) {
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        setAccessToken(newAccessToken);
        setRefreshToken(newRefreshToken);
        // Immediately update axios default headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        console.log('Token refresh successful - axios headers updated');
        return true;
      } else {
        console.error('Invalid refresh response - missing tokens');
        return false;
      }
    } catch (error: any) {
      console.error('Token refresh failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });
      
      // If refresh token is invalid, clear all tokens
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Refresh token is invalid or expired, clearing all tokens');
        clearInvalidTokens();
      }
      
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  // Set up axios defaults and interceptors
  useEffect(() => {
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }

    // Add response interceptor for automatic token refresh
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
          originalRequest._retry = true;

          try {
            setIsRefreshing(true);
            const success = await refreshAccessToken();
            if (success) {
              // Retry the original request with new token
              const newToken = localStorage.getItem('accessToken');
              if (newToken) {
                // Update the original request headers
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                
                // Preserve the original request's baseURL if it exists (from api instance)
                // Otherwise, set it to the configured baseURL
                if (!originalRequest.baseURL) {
                  const baseURL = getApiBaseUrl() || 'http://localhost:3000/api';
                  originalRequest.baseURL = baseURL;
                }
                
                // Retry with the updated request using global axios
                // The baseURL from the original request will be preserved
                console.log('Retrying request with new token:', {
                  url: originalRequest.url,
                  baseURL: originalRequest.baseURL,
                  method: originalRequest.method,
                });
                return axios(originalRequest);
              } else {
                console.error('Token refresh succeeded but no token found in localStorage');
                clearInvalidTokens();
              }
            } else {
              // Refresh failed, clear invalid tokens
              console.warn('Token refresh failed, clearing tokens');
              clearInvalidTokens();
            }
          } catch (refreshError) {
            // Refresh failed, clear invalid tokens
            console.error('Token refresh error:', refreshError);
            clearInvalidTokens();
            return Promise.reject(refreshError);
          } finally {
            setIsRefreshing(false);
          }
        }

        // If it's a 401 and we've already retried or can't refresh, reject
        if (error.response?.status === 401) {
          console.error('401 Unauthorized - Request failed:', {
            url: originalRequest?.url,
            method: originalRequest?.method,
            hasToken: !!originalRequest?.headers?.Authorization,
          });
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [accessToken, isRefreshing]);

  // Check if user is authenticated on mount (only once)
  useEffect(() => {
    if (isInitialized || isLoggingIn) {
      console.log('AuthProvider: Skipping auth check - isInitialized:', isInitialized, 'isLoggingIn:', isLoggingIn);
      return; // Prevent running during login
    }
    
    const checkAuth = async () => {
      console.log('AuthProvider: Starting auth check...');
      
      if (accessToken) {
        try {
          console.log('Checking auth with token:', accessToken.substring(0, 20) + '...');
          const response = await authAPI.getProfile();
          console.log('Auth response:', response.data);
          if (response.data.success && response.data.data?.user) {
            const userData = response.data.data.user;
            persistUser(userData);
            console.log('User set successfully:', userData);
            
            // Identify user in PostHog
            identifyUser(userData);
          } else {
            console.error('Invalid response structure:', response.data);
            if (!isLoggingIn) {
              clearInvalidTokens();
            }
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          // Try to refresh token only if not already refreshing
          if (!isRefreshing) {
            try {
              const success = await refreshAccessToken();
              if (!success && !isLoggingIn) {
                clearInvalidTokens();
              }
            } catch (refreshError) {
              if (!isLoggingIn) {
                clearInvalidTokens();
              }
            }
          }
        }
      } else {
        console.log('No access token found');
      }
      setIsLoading(false);
      setIsInitialized(true);
      console.log('AuthProvider: Auth check completed, isInitialized set to true');
    };

    console.log('AuthProvider: checkAuth called, isInitialized:', isInitialized, 'isLoggingIn:', isLoggingIn);
    checkAuth();
  }, [accessToken, isInitialized, isLoggingIn, isRefreshing]); // Removed function dependencies since they're now stable

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<User | null> => {
    try {
      setIsLoading(true);
      setIsLoggingIn(true); // Set logging in flag
      const response = await authAPI.login({
        email,
        password,
        rememberMe,
      });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: userData } = response.data;
      
      console.log('🔐 Login Debug:');
      console.log('Access token received:', !!newAccessToken);
      console.log('Token preview:', newAccessToken ? `${newAccessToken.substring(0, 20)}...` : 'No token');
      
      // Set tokens first
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      
      console.log('✅ Tokens saved to localStorage and state');
      
      // Set user data and persist (ensures tenantId is stored for X-Tenant-ID header)
      persistUser(userData);
      console.log('Login: User set successfully:', userData);
      
      // Identify user in PostHog
      identifyUser(userData);
      captureEvent('user_logged_in', {
        user_id: userData.id,
        email: userData.email,
        role: userData.role,
      });
      
      // Set loading to false after successful login
      setIsLoading(false);
      setIsLoggingIn(false); // Reset logging in flag
      
      toast.success('Login successful!');
      return userData;
    } catch (error: any) {
      console.error('Login: Error occurred:', error);
      setIsLoading(false);
      setIsLoggingIn(false); // Reset logging in flag
      toast.error(error.response?.data?.message || 'Login failed');
      return null;
    }
  };

  const register = async (userData: RegisterData): Promise<User | null> => {
    try {
      setIsLoading(true);
      setIsLoggingIn(true); // Set logging in flag
      const response = await authAPI.register(userData);
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: registeredUser } = response.data;
      
      // Set tokens first
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      
      // Set user data
      persistUser(registeredUser);
      console.log('Register: User set successfully:', registeredUser);
      
      // Identify user in PostHog
      identifyUser(registeredUser);
      captureEvent('user_registered', {
        user_id: registeredUser.id,
        email: registeredUser.email,
        role: registeredUser.role,
        user_type: userData.userType,
      });
      
      // Set loading to false after successful registration
      setIsLoading(false);
      setIsLoggingIn(false); // Reset logging in flag
      
      toast.success('Registration successful! Please check your email to verify your account.');
      return registeredUser;
    } catch (error: any) {
      console.error('Register: Error occurred:', error);
      setIsLoading(false);
      setIsLoggingIn(false); // Reset logging in flag
      toast.error(error.response?.data?.message || 'Registration failed');
      return null;
    }
  };

  const logout = () => {
    // Capture logout event before clearing user data
    if (user) {
      captureEvent('user_logged_out', {
        user_id: user.id,
        email: user.email,
        role: user.role,
      });
    }
    
    // Reset PostHog user
    resetUser();
    
    // Call logout endpoint to revoke refresh token
    if (refreshToken) {
      const baseURL = getApiBaseUrl() || 'http://localhost:3000/api';
      axios.post(`${baseURL}/auth/logout`, { refreshToken }).catch(console.error);
    }

    // Clear all tokens and user data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setRefreshToken(null);
    persistUser(null);
    setIsRefreshing(false);
    setIsLoading(false);
    setIsInitialized(false);
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    try {
      const baseURL = getApiBaseUrl() || 'http://localhost:3000/api';
      const response = await axios.patch(`${baseURL}/auth/profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const updatedUser = response.data.user;
      persistUser(updatedUser);
      toast.success('Profile updated successfully');
      return true;
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    login,
    register,
    logout,
    refreshAccessToken,
    updateProfile,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}