import axios from 'axios';
import type { 
  User, 
  CreateUserDto, 
  UpdateUserDto, 
  UserFilters, 
  UserListResponse 
} from '../types/user.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const userApi = {
  /**
   * Get all users for a tenant
   */
  async getTenantUsers(tenantId: string, filters?: UserFilters): Promise<UserListResponse> {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/users/tenant/${tenantId}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single user by ID
   */
  async getUserById(userId: string): Promise<{ success: boolean; data: User }> {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Create a new user in a tenant
   */
  async createTenantUser(tenantId: string, userData: CreateUserDto): Promise<{ success: boolean; data: User; message: string }> {
    const response = await apiClient.post(`/users/tenant/${tenantId}/user`, userData);
    return response.data;
  },

  /**
   * Update a user
   */
  async updateUser(userId: string, userData: UpdateUserDto): Promise<{ success: boolean; data: User; message: string }> {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  },

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: string): Promise<{ success: boolean; data: User; message: string }> {
    const response = await apiClient.patch(`/users/${userId}/status`, { status });
    return response.data;
  },

  /**
   * Change user role
   */
  async changeUserRole(userId: string, role: string): Promise<{ success: boolean; data: User; message: string }> {
    const response = await apiClient.patch(`/users/${userId}/role`, { role });
    return response.data;
  },

  /**
   * Reset user password
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/users/${userId}/reset-password`, { newPassword });
    return response.data;
  },

  /**
   * Get users by role
   */
  async getUsersByRole(tenantId: string, role: string): Promise<UserListResponse> {
    const response = await apiClient.get(`/users/tenant/${tenantId}/role/${role}`);
    return response.data;
  },

  /**
   * Check if a role is valid for tenant users
   */
  async checkTenantRole(role: string): Promise<{ exists: boolean; role: string; message: string }> {
    const response = await apiClient.get(`/users/check-tenant-role/${role}`);
    return response.data;
  },

  /**
   * Get all available tenants
   */
  async getAllTenants(): Promise<{ success: boolean; data: Array<{ id: string; name: string; type: string; location: string }> }> {
    const response = await apiClient.get('/tenant-dashboard/tenants/list');
    return response.data;
  },
};

export default userApi;
