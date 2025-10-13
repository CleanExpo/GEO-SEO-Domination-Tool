/**
 * Timeout Wrapper Utilities
 *
 * Provides comprehensive timeout protection for all external API calls
 * to prevent hanging requests that can trigger Vercel timeouts.
 *
 * @module lib/timeout-wrapper
 */

/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Error message if timeout occurs
 * @returns Promise that resolves with the result or rejects on timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${errorMessage} (${timeoutMs}ms)`)), timeoutMs)
    ),
  ]);
}

/**
 * Create an AbortController that times out
 * @param timeoutMs - Timeout in milliseconds
 * @returns AbortSignal that will abort after the specified timeout
 */
export function createTimeoutSignal(timeoutMs: number): AbortSignal {
  // Use the native AbortSignal.timeout if available (Node 16+)
  if ('timeout' in AbortSignal && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }

  // Fallback for older environments
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

/**
 * Create a fetch with timeout
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Fetch response
 */
export async function fetchWithTimeout(
  url: string | URL,
  options?: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  return fetch(url, {
    ...options,
    signal: createTimeoutSignal(timeoutMs)
  });
}

/**
 * Default timeout values for different operation types
 */
export const TIMEOUT_DEFAULTS = {
  /** Quick operations like health checks (10 seconds) */
  SHORT: 10000,

  /** Standard API calls (30 seconds) */
  MEDIUM: 30000,

  /** Long operations like web scraping (60 seconds - Pro plan only) */
  LONG: 60000,

  /** Very long operations like bulk processing (120 seconds - Pro plan only) */
  EXTRA_LONG: 120000
} as const;

/**
 * Get recommended timeout based on operation type
 * @param operationType - Type of operation
 * @returns Recommended timeout in milliseconds
 */
export function getRecommendedTimeout(operationType: 'api' | 'scraping' | 'analysis' | 'bulk'): number {
  switch (operationType) {
    case 'api':
      return TIMEOUT_DEFAULTS.MEDIUM;
    case 'scraping':
      return TIMEOUT_DEFAULTS.LONG;
    case 'analysis':
      return TIMEOUT_DEFAULTS.LONG;
    case 'bulk':
      return TIMEOUT_DEFAULTS.EXTRA_LONG;
    default:
      return TIMEOUT_DEFAULTS.MEDIUM;
  }
}