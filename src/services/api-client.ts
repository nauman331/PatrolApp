/**
 * API Client Configuration
 * Centralized axios instance with interceptors for production-ready API calls
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/env';

// Timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

/**
 * Create axios instance with default config
 */
const apiClient: AxiosInstance = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: REQUEST_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

/**
 * Request Interceptor
 * Adds auth token to every request
 */
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            // Get auth token from AsyncStorage
            const token = await AsyncStorage.getItem('authToken');

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting auth token:', error);
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor
 * Handles common error scenarios (401, 403, 500, etc.)
 */
apiClient.interceptors.response.use(
    (response) => {
        // Success - return response data
        return response;
    },
    async (error: AxiosError<any>) => {
        const { response, message } = error;

        // Handle specific status codes
        if (response?.status === 401) {
            // Unauthorized - token expired or invalid
            console.warn('Unauthorized - clearing auth state');
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userRole');
            // App will automatically redirect to login via RootNavigator
        } else if (response?.status === 403) {
            // Forbidden - no permission
            console.warn('Forbidden - access denied');
        } else if (response?.status === 404) {
            // Not found
            console.warn('Not found:', response.data?.message || 'Resource not found');
        } else if (response?.status === 500) {
            // Server error
            console.error('Server error:', response.data?.message || 'Internal server error');
        } else if (message === 'Network Error') {
            // Network error
            console.error('Network error - check internet connection');
        }

        return Promise.reject(error);
    }
);

export default apiClient;

/**
 * API Response Type
 * Standard response structure from backend
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    statusCode?: number;
}

/**
 * Pagination Type
 * For paginated API responses
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
