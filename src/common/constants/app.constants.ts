// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH: 'auth-storage',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
};

// Routes
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  INVENTORY: '/inventory',
  ORDERS: '/orders',
  PRODUCTS: '/products',
  SHOPS: '/shops',
  USERS: '/users',
  AUDIT_LOGS: '/audit-logs',
  NOTIFICATIONS: '/notifications',
  CLIENT_ROOT: '/client',
  CLIENT_DASHBOARD: '/client/dashboard',
};

// App Metadata
export const APP = {
  NAME: 'Inventory Distribution System',
  DESCRIPTION: 'Manage inventory and orders efficiently',
  VERSION: '1.0.0',
};
