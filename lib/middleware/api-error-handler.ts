import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(422, message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests') {
    super(429, message, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
  }
}

interface ErrorResponse {
  error: {
    message: string
    code?: string
    statusCode: number
    details?: any
    stack?: string
  }
}

export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  console.error('API Error:', error)

  // Handle ApiError instances
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          details: error.details,
          ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
          }),
        },
      },
      { status: error.statusCode }
    )
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          message: error.message || 'Internal server error',
          statusCode: 500,
          ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
          }),
        },
      },
      { status: 500 }
    )
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: {
        message: 'An unexpected error occurred',
        statusCode: 500,
      },
    },
    { status: 500 }
  )
}

// Async error wrapper for API routes
export function asyncHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// Validation helper
export function validateRequired(data: any, fields: string[]) {
  const missing: string[] = []

  for (const field of fields) {
    if (!data[field]) {
      missing.push(field)
    }
  }

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missing }
    )
  }
}

// Type guard for checking if error is ApiError
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
