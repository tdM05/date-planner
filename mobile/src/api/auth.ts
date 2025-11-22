import apiClient from './client';
import { ENDPOINTS } from '../constants/config';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  GoogleOAuthResponse,
  CalendarStatus,
} from '../types';

export const authAPI = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      ENDPOINTS.AUTH_LOGIN,
      credentials
    );
    return response.data;
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      ENDPOINTS.AUTH_REGISTER,
      data
    );
    return response.data;
  },

  /**
   * Get current user information
   */
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>(ENDPOINTS.AUTH_ME);
    return response.data;
  },

  /**
   * Initiate Google OAuth login
   * @param platform - Platform type: 'web' or 'mobile' (defaults to 'web')
   * @param redirectUrl - Optional redirect URL (defaults to current origin for web)
   */
  getGoogleAuthUrl: async (
    platform: 'web' | 'mobile' = 'web',
    redirectUrl?: string
  ): Promise<string> => {
    const params: { platform: string; redirect_url?: string } = { platform };

    if (redirectUrl) {
      params.redirect_url = redirectUrl;
    }

    const response = await apiClient.get<GoogleOAuthResponse>(
      ENDPOINTS.AUTH_GOOGLE_LOGIN,
      { params }
    );

    const authUrl = response.data.authorization_url;
    if (!authUrl) {
      throw new Error('No authorization URL received from server');
    }

    return authUrl;
  },

  /**
   * Get calendar connection status for user and partner
   */
  getCalendarStatus: async (): Promise<CalendarStatus> => {
    const response = await apiClient.get<CalendarStatus>(
      ENDPOINTS.AUTH_CALENDAR_STATUS
    );
    return response.data;
  },
};
