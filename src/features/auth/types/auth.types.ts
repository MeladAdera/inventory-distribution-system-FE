import { ApiResponse } from '@/common/types/api.types';
import { UserRole } from './enums';

export interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  shopId?: number;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type LoginResponse = ApiResponse<{
  user: RequestUser;
  accessToken: string;
  refreshToken: string;
}>;

export type RefreshTokenResponse = ApiResponse<AuthTokens>;

export type CurrentUserResponse = ApiResponse<RequestUser>;

export interface AuthState {
  user: RequestUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
}
