/**
 * Global Axios Configuration
 *
 * Sets up axios with default timeout, interceptors, and error handling
 * to prevent hanging requests on external API calls.
 *
 * @module lib/axios-config
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import { TIMEOUT_DEFAULTS } from './timeout-wrapper';

// Set global defaults
axios.defaults.timeout = TIMEOUT_DEFAULTS.MEDIUM; // 30 seconds default
axios.defaults.headers.common['User-Agent'] = 'GEO-SEO-Domination-Tool/1.0';

// Request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url || 'unknown';
    const timeout = config.timeout || axios.defaults.timeout;

    console.log(`[Axios] ${method} ${url} (timeout: ${timeout}ms)`);
    return config;
  },
  (error) => {
    console.error('[Axios] Request setup error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axios.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase() || 'GET';
    const url = response.config.url || 'unknown';
    console.log(`[Axios] ${method} ${url} - ${response.status} OK`);
    return response;
  },
  (error: AxiosError) => {
    const method = error.config?.method?.toUpperCase() || 'GET';
    const url = error.config?.url || 'unknown';

    if (error.code === 'ECONNABORTED') {
      console.error(`[Axios] ${method} ${url} - TIMEOUT after ${error.config?.timeout}ms`);
      error.message = `Request timeout: ${url} (exceeded ${error.config?.timeout}ms)`;
    } else if (error.code === 'ETIMEDOUT') {
      console.error(`[Axios] ${method} ${url} - CONNECTION TIMEOUT`);
      error.message = `Connection timeout: ${url}`;
    } else if (error.response) {
      console.error(`[Axios] ${method} ${url} - ${error.response.status} ${error.response.statusText}`);
    } else if (error.request) {
      console.error(`[Axios] ${method} ${url} - No response received`);
    } else {
      console.error(`[Axios] ${method} ${url} - ${error.message}`);
    }

    return Promise.reject(error);
  }
);

/**
 * Create a custom axios instance with specific timeout
 * @param timeoutMs - Timeout in milliseconds
 * @returns Configured axios instance
 */
export function createAxiosInstance(timeoutMs: number = TIMEOUT_DEFAULTS.MEDIUM): AxiosInstance {
  const instance = axios.create({
    timeout: timeoutMs,
    headers: {
      'User-Agent': 'GEO-SEO-Domination-Tool/1.0'
    }
  });

  // Add the same interceptors to the custom instance
  instance.interceptors.request.use(
    (config) => {
      const method = config.method?.toUpperCase() || 'GET';
      const url = config.url || 'unknown';
      const timeout = config.timeout || timeoutMs;

      console.log(`[Axios Instance] ${method} ${url} (timeout: ${timeout}ms)`);
      return config;
    },
    (error) => {
      console.error('[Axios Instance] Request setup error:', error.message);
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const method = error.config?.method?.toUpperCase() || 'GET';
      const url = error.config?.url || 'unknown';

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        console.error(`[Axios Instance] ${method} ${url} - TIMEOUT`);
        error.message = `Request timeout: ${url}`;
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

// Export configured axios as default
export default axios;