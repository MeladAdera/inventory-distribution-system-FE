import { apiClient } from '@/common/api';
import {
  LoginCredentials,
  LoginResponse,
  RefreshTokenResponse,
  CurrentUserResponse,
  ChangePasswordInput,
  ForgotPasswordInput,
  ForgotPasswordResponse,
  ResetPasswordInput,
  ResetPasswordResponse,
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

  // Emails a 6-digit reset code valid for 10 minutes. Always resolves 200 with the
  // same generic message whether or not the email is registered, so callers must not
  // infer account existence from the response. Rate limited to 3 req / 15 min.
  forgotPassword: async (data: ForgotPasswordInput): Promise<ForgotPasswordResponse> => {
    const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', data);
    return response.data;
  },

  // Consumes the code and sets the new password. Side effect: on success the backend
  // invalidates every existing session, so the user must log in again.
  // Rate limited to 5 req / min.
  resetPassword: async (data: ResetPasswordInput): Promise<ResetPasswordResponse> => {
    const response = await apiClient.post<ResetPasswordResponse>('/auth/reset-password', data);
    return response.data;
  },
};
