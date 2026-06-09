import { create } from 'zustand';
import { AuthState, RequestUser } from '../types/auth.types';

interface AuthActions {
  setAuth: (user: RequestUser) => void;
  setInitializing: (value: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  setAuth: (user) => set({ user, isAuthenticated: true }),
  setInitializing: (value) => set({ isInitializing: value }),
  clearAuth: () => set({ user: null, isAuthenticated: false }),
}));
