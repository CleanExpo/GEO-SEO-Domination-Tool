/**
 * Structured Logging with Winston
 * Provides log levels, formatting, and transports for production monitoring
 * Phase 3: MONITOR-001
 */

import winston from 'winston';

// ============================================================
// LOG LEVELS
// ============================================================

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(LOG_COLORS);

// ============================================================
// FORMATS
// ============================================================

/**
 * Production format: JSON with timestamps
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Development format: Colourised console output
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message} ${info.stack || ''}`
  )
);

// ============================================================
// TRANSPORTS
// ============================================================

const transports: winston.transport[] = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  })
);

// File transports (production only)
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: productionFormat,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: productionFormat,
    })
  );
}

// ============================================================
// LOGGER INSTANCE
// ============================================================

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: LOG_LEVELS,
  format: productionFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Log with automatic context scrubbing
 */
export function logWithContext(
  level: 'error' | 'warn' | 'info' | 'http' | 'debug',
  message: string,
  context?: Record<string, any>
) {
  const scrubbedContext = context ? scrubbedLogContext(context) : undefined;

  logger.log(level, message, scrubbedContext);
}

/**
 * Scrub sensitive data from log context
 */
function scrubbedLogContext(context: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    'password',
    'secret',
    'token',
    'api_key',
    'apiKey',
    'access_token',
    'authorization',
    'cookie',
    'session',
  ];

  const scrubbed = { ...context };

  for (const key in scrubbed) {
    const isSensitive = sensitiveKeys.some((sensitiveKey) =>
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof scrubbed[key] === 'object' && scrubbed[key] !== null) {
      scrubbed[key] = scrubbedLogContext(scrubbed[key]);
    }
  }

  return scrubbed;
}

// ============================================================
// CONVENIENCE METHODS
// ============================================================

export const log = {
  error: (message: string, context?: Record<string, any>) => logWithContext('error', message, context),
  warn: (message: string, context?: Record<string, any>) => logWithContext('warn', message, context),
  info: (message: string, context?: Record<string, any>) => logWithContext('info', message, context),
  http: (message: string, context?: Record<string, any>) => logWithContext('http', message, context),
  debug: (message: string, context?: Record<string, any>) => logWithContext('debug', message, context),
};

// ============================================================
// HTTP REQUEST LOGGING
// ============================================================

/**
 * Log HTTP request
 */
export function logHttpRequest(
  method: string,
  url: string,
  statusCode: number,
  responseTime: number,
  userId?: string
) {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';

  logWithContext(level, `${method} ${url} ${statusCode}`, {
    method,
    url,
    statusCode,
    responseTime,
    userId,
  });
}

// ============================================================
// PERFORMANCE LOGGING
// ============================================================

/**
 * Measure and log operation performance
 */
export async function measureAndLog<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    logWithContext('info', `${operation} completed`, { duration, success: true });

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logWithContext('error', `${operation} failed`, {
      duration,
      success: false,
      error: error.message,
      stack: error.stack,
    });

    throw error;
  }
}

// ============================================================
// EXPORT DEFAULT LOGGER
// ============================================================

export default logger;
