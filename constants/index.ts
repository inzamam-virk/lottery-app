// App Configuration
export const APP_CONFIG = {
  NAME: 'LotteryApp',
  VERSION: '1.0.0',
  TIMEZONE: 'Asia/Karachi', // PKT
} as const;

// Lottery Configuration
export const LOTTERY_CONFIG = {
  NUMBER_RANGE: {
    MIN: 0,
    MAX: 999,
  },
  DRAW_INTERVAL: 60 * 60 * 1000, // 1 hour in milliseconds
  BET_CUTOFF_MINUTES: 15, // 15 minutes before draw
  REFUND_PERCENTAGE: 20, // 20% refund for losing bets
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://your-project.supabase.co',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
} as const;

// Navigation Routes
export const ROUTES = {
  // Public routes
  HOME: '/',
  STREAMING: '/streaming',
  RESULTS: '/results',
  
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Dealer routes
  DEALER_DASHBOARD: '/dealer',
  NEW_BET: '/dealer/new-bet',
  BET_HISTORY: '/dealer/bets',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin',
  MANAGE_DRAWS: '/admin/draws',
  MANAGE_STREAMS: '/admin/streams',
  MANAGE_USERS: '/admin/users',
} as const;

// UI Constants
export const UI = {
  COLORS: {
    PRIMARY: '#007AFF',
    SECONDARY: '#5856D6',
    SUCCESS: '#34C759',
    WARNING: '#FF9500',
    ERROR: '#FF3B30',
    BACKGROUND: '#F2F2F7',
    CARD: '#FFFFFF',
    TEXT: '#000000',
    TEXT_SECONDARY: '#8E8E93',
    WHITE: '#FFFFFF',
    BORDER: '#E5E5EA',
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    LARGE: 24,
    MEDIUM: 16,
    SMALL: 8,
  },
  BORDER_RADIUS: {
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 24,
    MEDIUM: 12,
  },
  FONT_SIZES: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XLARGE: 24,
    XXL: 28,
    XXXL: 32,
  },
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;
