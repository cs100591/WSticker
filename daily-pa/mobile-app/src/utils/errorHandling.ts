/**
 * Error Handling Utilities
 * Centralized error handling, formatting, and logging
 */

import { crashLogger } from '@/services/crashLogger';

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  SYNC = 'SYNC',
  STORAGE = 'STORAGE',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  name: string;
  type: ErrorType;
  message: string;
  originalError?: Error;
  timestamp: Date;
  context?: Record<string, any>;
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    
    case ErrorType.AUTHENTICATION:
      return 'Authentication failed. Please check your credentials and try again.';
    
    case ErrorType.VALIDATION:
      return error.message || 'Please check your input and try again.';
    
    case ErrorType.SYNC:
      return 'Failed to sync your data. Your changes are saved locally and will sync when connection is restored.';
    
    case ErrorType.STORAGE:
      return 'Unable to save data locally. Please check your device storage.';
    
    case ErrorType.PERMISSION:
      return 'Permission denied. Please grant the required permissions in your device settings.';
    
    case ErrorType.UNKNOWN:
    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Determine error type from error object
 */
export function getErrorType(error: unknown): ErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ErrorType.NETWORK;
    }
    
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return ErrorType.AUTHENTICATION;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    
    if (message.includes('sync')) {
      return ErrorType.SYNC;
    }
    
    if (message.includes('storage') || message.includes('quota')) {
      return ErrorType.STORAGE;
    }
    
    if (message.includes('permission')) {
      return ErrorType.PERMISSION;
    }
  }
  
  return ErrorType.UNKNOWN;
}

/**
 * Create an AppError from any error
 */
export function createAppError(
  error: unknown,
  context?: Record<string, any>
): AppError {
  const type = getErrorType(error);
  const message = formatErrorMessage(error);
  
  return {
    name: 'AppError',
    type,
    message,
    originalError: error instanceof Error ? error : undefined,
    timestamp: new Date(),
    context,
  };
}

/**
 * Log error (sanitized for sensitive data)
 */
export function logError(error: AppError): void {
  // Sanitize context to remove sensitive data
  const sanitizedContext = sanitizeContext(error.context);
  
  console.error('[Error]', {
    type: error.type,
    message: error.message,
    timestamp: error.timestamp.toISOString(),
    context: sanitizedContext,
    stack: error.originalError?.stack,
  });
  
  // Log to crash logger for persistent storage
  crashLogger.logCrash(error).catch(err => {
    console.error('[Error] Failed to log crash:', err);
  });
}

/**
 * Sanitize context to remove sensitive data
 */
function sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
  if (!context) return undefined;
  
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeContext(value as Record<string, any>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: AppError): boolean {
  return [
    ErrorType.NETWORK,
    ErrorType.SYNC,
  ].includes(error.type);
}

/**
 * Get retry delay for recoverable errors (exponential backoff)
 */
export function getRetryDelay(attemptNumber: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const delay = baseDelay * Math.pow(2, attemptNumber);
  return Math.min(delay, maxDelay);
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  onRetry?: (attempt: number, error: AppError) => void
): Promise<T> {
  let lastError: AppError | null = null;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = createAppError(error, { attempt });
      
      if (attempt < maxAttempts - 1 && isRecoverableError(lastError)) {
        const delay = getRetryDelay(attempt);
        onRetry?.(attempt + 1, lastError);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }
  
  if (lastError) {
    logError(lastError);
    throw lastError;
  }
  
  throw new Error('Retry failed without error');
}

/**
 * Handle error and show user-friendly message
 */
export function handleError(
  error: unknown,
  context?: Record<string, any>
): { message: string; canRetry: boolean } {
  const appError = createAppError(error, context);
  logError(appError);
  
  return {
    message: getUserFriendlyMessage(appError),
    canRetry: isRecoverableError(appError),
  };
}

/**
 * Network error helper
 */
export function createNetworkError(message?: string): AppError {
  return {
    name: 'AppError',
    type: ErrorType.NETWORK,
    message: message || 'Network error occurred',
    timestamp: new Date(),
  };
}

/**
 * Authentication error helper
 */
export function createAuthError(message?: string): AppError {
  return {
    name: 'AppError',
    type: ErrorType.AUTHENTICATION,
    message: message || 'Authentication failed',
    timestamp: new Date(),
  };
}

/**
 * Validation error helper
 */
export function createValidationError(message: string, field?: string): AppError {
  return {
    name: 'AppError',
    type: ErrorType.VALIDATION,
    message,
    timestamp: new Date(),
    context: field ? { field } : undefined,
  };
}
