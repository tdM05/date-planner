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
    } catch (error) {
      console.error('Error retrieving JWT token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<APIError>) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle 401 Unauthorized (token expired or invalid)
      if (status === 401) {
        // Clear stored token and redirect to login
        await AsyncStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
        // You can dispatch a logout action here if using global state
      }

      // Handle 428 Precondition Required (calendar not connected)
      if (status === 428) {
        console.warn('Calendar not connected:', data.detail);
      }

      // Return formatted error
      return Promise.reject({
        status,
        message: data?.detail || 'An error occurred',
      });
    }

    // Network error
    if (error.message === 'Network Error') {
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
      });
    }

    // Timeout error
    if (error.code === 'ECONNABORTED') {
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
