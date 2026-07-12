import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/store/authStore';
import { tokenUtils } from '@/features/auth/utils/token.utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined. Check your .env.local file.');
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = tokenUtils.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const lang = typeof window !== 'undefined' ? document.documentElement.lang : 'en';
    config.headers['Accept-Language'] = lang || 'en';
    return config;
  },
  (error) => Promise.reject(error)
);

// Single-flight token refresh.
//
// Refresh tokens rotate on every /auth/refresh, and the backend now treats a
// re-used (already-rotated) refresh token as theft — it revokes ALL of the
// user's tokens and forces a re-login. So concurrent 401s must NOT each fire
// their own refresh with the same token. Instead the first 401 starts the
// refresh and every other in-flight 401 awaits the same promise, then retries
// with the single new access token.
let refreshPromise: Promise<string> | null = null;

async function runTokenRefresh(): Promise<string> {
  const refreshToken = tokenUtils.getRefreshToken();
  if (!refreshToken) {
    throw new Error('NO_REFRESH_TOKEN');
  }

  const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  // Success responses are enveloped by the backend's global TransformInterceptor
  // as { success, data, timestamp }, so the tokens live under `data` — never at
  // the top level. The `?? response.data` is a defensive fallback only.
  const body = response.data?.data ?? response.data;
  const { accessToken, refreshToken: newRefreshToken } = body;

  // Persist the freshly rotated pair immediately so the very next refresh sends
  // the newest token, never the one we just consumed.
  tokenUtils.setTokens(accessToken, newRefreshToken);
  return accessToken;
}

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = runTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosError['config'] & {
      _retry?: boolean;
      skipAuthRedirect?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        // Background sync requests opt out of the forced redirect: a queue flush
        // firing while the owner is on another page must not yank them to /login
        // and lose the queue. Tag the error so the sync engine can pause and show
        // a non-disruptive "log in again to finish syncing" banner instead.
        if (originalRequest.skipAuthRedirect) {
          return Promise.reject(Object.assign(error, { authRequired: true }));
        }

        // Refresh failed (or reuse-detected) — clear every token store and force re-login
        useAuthStore.getState().clearAuth();
        tokenUtils.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
