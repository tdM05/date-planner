import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '../constants/config';
import { APIError } from '../types';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log request
      console.log('[API Request]', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        data: config.data,
        headers: config.headers,
      });
    } catch (error) {
      console.error('[API] Error retrieving JWT token:', error);
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful response
    console.log('[API Response]', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error: AxiosError<APIError>) => {
    console.error('[API Error]', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });

    if (error.response) {
      const { status, data } = error.response;

      // Handle 401 Unauthorized (token expired or invalid)
      if (status === 401) {
        console.warn('[API] 401 Unauthorized - clearing auth');
        // Clear stored token and redirect to login
        await AsyncStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
        // You can dispatch a logout action here if using global state
      }

      // Handle 428 Precondition Required (calendar not connected)
      if (status === 428) {
        console.warn('[API] Calendar not connected:', data.detail);
      }

      // Format error message
      let message = 'An error occurred';
      if (data?.detail) {
        // Handle validation errors (array of errors)
        if (Array.isArray(data.detail)) {
          message = data.detail.map((err: any) => err.msg || err.message).join(', ');
        } else if (typeof data.detail === 'string') {
          message = data.detail;
        } else {
          message = JSON.stringify(data.detail);
        }
      }

      // Return formatted error
      return Promise.reject({
        status,
        message,
      });
    }

    // Network error
    if (error.message === 'Network Error') {
      console.error('[API] Network error');
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
      });
    }

    // Timeout error
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timeout');
      return Promise.reject({
        status: 0,
        message: 'Request timeout. Please try again.',
      });
    }

    return Promise.reject({
      status: 0,
      message: 'An unexpected error occurred',
    });
  }
);

export default apiClient;
