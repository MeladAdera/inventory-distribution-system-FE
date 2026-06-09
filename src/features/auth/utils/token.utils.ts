const AUTH_COOKIE_NAME = 'auth_token';
const REFRESH_COOKIE_NAME = 'refresh_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function readCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

export const tokenUtils = {
  getAccessToken: (): string | null => readCookie(AUTH_COOKIE_NAME),

  getRefreshToken: (): string | null => readCookie(REFRESH_COOKIE_NAME),

  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window === 'undefined') return;
    document.cookie = `${AUTH_COOKIE_NAME}=${accessToken}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    document.cookie = `${REFRESH_COOKIE_NAME}=${refreshToken}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `${REFRESH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  },

  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },
};
