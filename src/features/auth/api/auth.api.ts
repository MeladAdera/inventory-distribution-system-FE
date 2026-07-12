import { apiClient } from '@/common/api';
import {
  LoginCredentials,
  LoginResponse,
  RefreshTokenResponse,
  CurrentUserResponse,
  ChangePasswordInput,
} from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },

  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    const response = await apiClient.get<CurrentUserResponse>('/auth/me');
    return response.data;
  },

  // Any authenticated user can change their own password. Returns 204 No Content.
  // Side effect: on success the backend revokes all refresh tokens, so the caller
  // must re-authenticate afterwards.
  changePassword: async (data: ChangePasswordInput): Promise<void> => {
    await apiClient.post('/auth/change-password', data);
  },
};
