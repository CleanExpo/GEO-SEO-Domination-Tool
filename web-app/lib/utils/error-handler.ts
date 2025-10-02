/**
 * Centralized Error Handling
 * Provides consistent error handling and user-friendly error messages
 */

import { logger } from './logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id "${id}" not found` : `${resource} not found`;
    super(message, 404, true, { resource, id });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Too many requests. Please try again later.', 429, true, {
      retryAfter,
    });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, originalError?: Error) {
    super(`External service error (${service}): ${message}`, 502, true, {
      service,
      originalError: originalError?.message,
    });
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, table: string, originalError?: Error) {
    super(
      `Database error during ${operation} on ${table}`,
      500,
      false, // Not operational - indicates system issue
      {
        operation,
        table,
        originalError: originalError?.message,
      }
    );
  }
}

/**
 * Global error handler
 */
export class ErrorHandler {
  public static handle(error: Error | AppError): {
    statusCode: number;
    message: string;
    details?: Record<string, any>;
  } {
    if (error instanceof AppError) {
      // Log based on severity
      if (error.statusCode >= 500) {
        logger.error(error.message, error, error.context);
      } else {
        logger.warn(error.message, error.context);
      }

      return {
        statusCode: error.statusCode,
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.context : undefined,
      };
    }

    // Unknown error - treat as critical
    logger.critical('Unhandled error', error);

    return {
      statusCode: 500,
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message,
      details: process.env.NODE_ENV === 'development'
        ? { stack: error.stack }
        : undefined,
    };
  }

  /**
   * Wrap async functions with error handling
   */
  public static async wrapAsync<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (context) {
        logger.error(`Error in ${context}`, error as Error);
      }
      throw error;
    }
  }

  /**
   * Safe database operation wrapper
   */
  public static async safeDbOperation<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      logger.dbQuery(operation, table);
      const result = await fn();
      return result;
    } catch (error) {
      logger.dbError(operation, table, error as Error);
      throw new DatabaseError(operation, table, error as Error);
    }
  }

  /**
   * Safe external API call wrapper
   */
  public static async safeExternalCall<T>(
    service: string,
    endpoint: string,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      logger.externalApiCall(service, endpoint);
      const result = await fn();
      return result;
    } catch (error) {
      logger.externalApiError(service, endpoint, error as Error);
      throw new ExternalServiceError(service, (error as Error).message, error as Error);
    }
  }

  /**
   * Retry wrapper with exponential backoff
   */
  public static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt);
          logger.warn(`Retry attempt ${attempt + 1} after ${delay}ms`, {
            error: (error as Error).message,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }
}
