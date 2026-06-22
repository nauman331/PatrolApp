/**
 * API Client Configuration
 * Centralized axios instance with interceptors for production-ready API calls
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/env';

// Timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

function getStoreAuthToken(): string | null {
  try {
    // Lazy require avoids store -> slice -> api circular init issues.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const appStore = require('../store/store').default;
    const token = appStore.getState()?.auth?.token;
    return typeof token === 'string' && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Create axios instance with default config
 */
const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

if (__DEV__) {
    console.log('[PatrolApp] API client baseURL:', API_URL);
}

/**
 * Request Interceptor
 * Adds auth token to every request
 */
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token =
                getStoreAuthToken() ?? (await AsyncStorage.getItem('authToken'));

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            } else if (__DEV__) {
                console.warn('[PatrolApp] API request without auth token:', config.url);
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
        return response;
    },
    async (error: AxiosError<any>) => {
        const { response, message, config } = error;
        const requestUrl = config?.baseURL
            ? `${config.baseURL}${config.url ?? ''}`
            : config?.url;

        if (response?.status === 401) {
            console.warn('Unauthorized:', requestUrl);
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('guardId');
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const appStore = require('../store/store').default;
                const { clearAuth } = require('../store/slices/authSlice');
                appStore.dispatch(clearAuth());
            } catch {
                // ignore if store is unavailable during teardown
            }
        } else if (response?.status === 403) {
            console.warn('Forbidden - access denied:', requestUrl);
        } else if (response?.status === 404) {
            console.warn('Not found:', requestUrl, response.data?.message || 'Resource not found');
        } else if (response?.status === 500) {
            console.error('Server error:', requestUrl, response.data?.message || 'Internal server error');
        } else if (message === 'Network Error') {
            console.error('Network error:', requestUrl);
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
