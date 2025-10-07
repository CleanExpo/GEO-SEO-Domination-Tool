/**
 * Centralized Logging Utility
 * Provides consistent logging across the application
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  stackTrace?: string;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  private formatLog(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level}]`,
      entry.message,
    ];

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(`Context: ${JSON.stringify(entry.context)}`);
    }

    if (entry.error) {
      parts.push(`Error: ${entry.error.message}`);
    }

    if (entry.stackTrace && this.isDevelopment) {
      parts.push(`\nStack: ${entry.stackTrace}`);
    }

    return parts.join(' ');
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      stackTrace: error?.stack,
    };
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
      console.debug(this.formatLog(entry));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    console.log(this.formatLog(entry));
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    console.warn(this.formatLog(entry));
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    console.error(this.formatLog(entry));

    // In production, you might want to send to error tracking service
    // e.g., Sentry, Rollbar, etc.
  }

  critical(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, context, error);
    console.error(`🚨 CRITICAL: ${this.formatLog(entry)}`);

    // In production, send immediate alerts
  }

  // API-specific logging
  apiRequest(method: string, path: string, params?: Record<string, any>): void {
    this.debug(`API Request: ${method} ${path}`, params);
  }

  apiResponse(method: string, path: string, status: number, duration: number): void {
    const level = status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.DEBUG;
    const entry = this.createLogEntry(
      level,
      `API Response: ${method} ${path}`,
      { status, duration: `${duration}ms` }
    );

    if (level === LogLevel.ERROR || level === LogLevel.WARN) {
      console.warn(this.formatLog(entry));
    } else if (this.isDevelopment) {
      console.log(this.formatLog(entry));
    }
  }

  // Database operation logging
  dbQuery(operation: string, table: string, params?: Record<string, any>): void {
    this.debug(`DB Query: ${operation} on ${table}`, params);
  }

  dbError(operation: string, table: string, error: Error): void {
    this.error(`DB Error: ${operation} on ${table}`, error);
  }

  // External API logging
  externalApiCall(service: string, endpoint: string, params?: Record<string, any>): void {
    this.debug(`External API: ${service} - ${endpoint}`, params);
  }

  externalApiError(service: string, endpoint: string, error: Error): void {
    this.error(`External API Error: ${service} - ${endpoint}`, error);
  }
}

export const logger = new Logger();
