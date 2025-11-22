import Constants from 'expo-constants';

// API Configuration
export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';
export const API_VERSION = 'v1';
export const API_URL = `${API_BASE_URL}/api/${API_VERSION}`;

// OAuth Configuration
export const OAUTH_REDIRECT_URI = 'dateplanner://oauth/callback';

// Storage Keys
export const STORAGE_KEYS = {
  JWT_TOKEN: '@date_planner_jwt_token',
  USER_DATA: '@date_planner_user_data',
} as const;

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_ME: '/auth/me',
  AUTH_GOOGLE_LOGIN: '/auth/google/login',
  AUTH_GOOGLE_CALLBACK: '/auth/google/callback',
  AUTH_CALENDAR_STATUS: '/auth/calendar-status',

  // Couples
  COUPLES_INVITE: '/couples/invite',
  COUPLES_ACCEPT: '/couples/accept',
  COUPLES_PARTNER: '/couples/partner',

  // Dates
  DATES_GENERATE: '/dates/generate-couple-date-plan',
} as const;
