import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper to get auth state from localStorage
const getAuthState = () => {
  if (typeof window === 'undefined') return null;

  const authStorage = localStorage.getItem('auth-storage');
  if (!authStorage) return null;

  try {
    const { state } = JSON.parse(authStorage);
    return state;
  } catch (e) {
    console.error('Error parsing auth storage:', e);
    return null;
  }
};

// Helper to update auth state in localStorage
const updateAuthState = (accessToken: string, refreshToken: string) => {
  if (typeof window === 'undefined') return;

  const authStorage = localStorage.getItem('auth-storage');
  if (!authStorage) return;

  try {
    const parsed = JSON.parse(authStorage);
    parsed.state = {
      ...parsed.state,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    };
    localStorage.setItem('auth-storage', JSON.stringify(parsed));
  } catch (e) {
    console.error('Error updating auth storage:', e);
  }
};

// Helper to clear auth state
const clearAuthState = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth-storage');
};

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = getAuthState();
    if (state?.accessToken) {
      config.headers.Authorization = `Bearer ${state.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If no config or already retried, reject
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry for login or refresh endpoints
      if (
        originalRequest.url?.includes('/api/auth/login') ||
        originalRequest.url?.includes('/api/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const state = getAuthState();
      if (!state?.refreshToken) {
        isRefreshing = false;
        clearAuthState();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken: state.refreshToken,
        });

        const { accessToken, refreshToken } = response.data;

        // Update tokens in localStorage
        updateAuthState(accessToken, refreshToken);

        // Process queued requests
        processQueue(null, accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear auth storage on refresh failure
        processQueue(refreshError as Error, null);
        clearAuthState();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
