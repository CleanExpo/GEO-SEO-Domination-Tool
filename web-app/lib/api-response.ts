import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Standardized API response helpers
 * Provides consistent response format across all API routes
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * Error response helper
 */
export function errorResponse(
  error: string,
  status: number = 400,
  code?: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  logger.warn('API Error Response', {
    error,
    status,
    code,
    details,
  });

  return NextResponse.json(
    {
      success: false,
      error,
      code,
      details,
    },
    { status }
  );
}

/**
 * Validation error response
 */
export function validationError(
  details: unknown
): NextResponse<ApiErrorResponse> {
  return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', details);
}

/**
 * Authentication error response
 */
export function authError(
  message: string = 'Authentication required'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 401, 'AUTH_ERROR');
}

/**
 * Authorization error response
 */
export function forbiddenError(
  message: string = 'Insufficient permissions'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 403, 'FORBIDDEN');
}

/**
 * Not found error response
 */
export function notFoundError(
  resource: string = 'Resource'
): NextResponse<ApiErrorResponse> {
  return errorResponse(`${resource} not found`, 404, 'NOT_FOUND');
}

/**
 * Rate limit error response
 */
export function rateLimitError(
  retryAfter?: number
): NextResponse<ApiErrorResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (retryAfter) {
    headers['Retry-After'] = Math.ceil(retryAfter / 1000).toString();
  }

  const response = NextResponse.json(
    {
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    { status: 429, headers }
  );

  return response;
}

/**
 * Server error response
 */
export function serverError(
  error?: Error
): NextResponse<ApiErrorResponse> {
  if (error) {
    logger.error('Server error', error);
  }

  return errorResponse(
    'Internal server error',
    500,
    'SERVER_ERROR'
  );
}

/**
 * Typed response helper that automatically handles errors
 */
export async function handleApiRequest<T>(
  handler: () => Promise<T>
): Promise<NextResponse<ApiSuccessResponse<T> | ApiErrorResponse>> {
  try {
    const data = await handler();
    return successResponse(data);
  } catch (error) {
    logger.error('API request error', error as Error);

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('not found')) {
        return notFoundError();
      }
      if (error.message.includes('unauthorized')) {
        return authError();
      }
      if (error.message.includes('forbidden')) {
        return forbiddenError();
      }
    }

    return serverError(error as Error);
  }
}
