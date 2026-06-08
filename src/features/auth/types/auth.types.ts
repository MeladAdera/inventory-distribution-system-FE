import { UserRole } from './enums';

export interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: RequestUser;
    accessToken: string;
    refreshToken: string;
  };
}

export interface AuthState {
  user: RequestUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}
