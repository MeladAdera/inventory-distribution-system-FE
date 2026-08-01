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
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  PROFIT: '/profit',
  INVENTORY: '/inventory',
  ORDERS: '/orders',
  TRANSFERS: '/transfers',
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  CLIENTS: '/clients',
  SHOPS: '/shops',
  USERS: '/users',
  RECEIPTS: '/receipts',
  SHORTAGES: '/shortages',
  DEBTS: '/debts',
  AUDIT_LOGS: '/audit-logs',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
  CLIENT_ROOT: '/client',
  CLIENT_DASHBOARD: '/client/dashboard',
  CLIENT_INVENTORY: '/client/inventory',
  CLIENT_CATALOG: '/client/catalog',
  CLIENT_SELL: '/client/sell',
  CLIENT_PROFIT: '/client/profit',
  CLIENT_RECEIPTS: '/client/receipts',
  CLIENT_CUSTOMERS: '/client/customers',
  CLIENT_DEBTS: '/client/debts',
};

// App Metadata
export const APP = {
  NAME: 'Inventory Distribution System',
  DESCRIPTION: 'Manage inventory and orders efficiently',
  VERSION: '1.0.0',
};
