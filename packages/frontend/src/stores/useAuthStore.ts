import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/axios';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'farmer';
  status: 'active' | 'inactive';
  farmId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  clearError: () => void;

  // Async actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  refreshAccessToken: () => Promise<boolean>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      logout: () => {
        // Call logout endpoint if we have a token
        const { accessToken } = get();
        if (accessToken) {
          api.post('/api/auth/logout').catch(() => {
            // Ignore errors on logout
          });
        }

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.post<AuthTokens>(
            '/api/auth/login',
            credentials
          );
          const { accessToken, refreshToken } = response.data;

          set({
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Fetch user profile after successful login
          await get().fetchProfile();

          return true;
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || 'Invalid email or password';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          return false;
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          return false;
        }

        try {
          const response = await api.post<AuthTokens>('/api/auth/refresh', {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefreshToken } = response.data;

          set({
            accessToken,
            refreshToken: newRefreshToken,
            isAuthenticated: true,
          });

          return true;
        } catch (error) {
          // Clear auth state on refresh failure
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          return false;
        }
      },

      fetchProfile: async () => {
        try {
          const response = await api.get<User>('/api/auth/me');
          set({ user: response.data });
        } catch (error) {
          // If profile fetch fails, don't clear auth state
          // The token might still be valid
          console.error('Failed to fetch profile:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
