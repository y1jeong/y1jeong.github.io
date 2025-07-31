import { Request, Response, NextFunction } from 'express';
import { logger, logError } from '@/utils/logger';

// Custom error class for application errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: Record<string, any>
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error class
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

// Authentication error class
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

// Authorization error class
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

// Not found error class
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND_ERROR');
  }
}

// Conflict error class
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, 'CONFLICT_ERROR');
  }
}

// Rate limit error class
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
  }
}

// File processing error class
export class FileProcessingError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 422, true, 'FILE_PROCESSING_ERROR', details);
  }
}

// Database error class
export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 500, true, 'DATABASE_ERROR', details);
  }
}

// External service error class
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`${service} service error: ${message}`, 502, true, 'EXTERNAL_SERVICE_ERROR');
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: Record<string, any>;
    timestamp: string;
    path: string;
    requestId?: string;
  };
}

// Helper function to determine if error is operational
const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

// Helper function to handle different types of errors
const handleError = (error: Error): { statusCode: number; message: string; code?: string; details?: Record<string, any> } => {
  // Handle custom application errors
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details
    };
  }
  
  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const details: Record<string, string> = {};
    if ('errors' in error) {
      const mongooseError = error as any;
      Object.keys(mongooseError.errors).forEach(key => {
        details[key] = mongooseError.errors[key].message;
      });
    }
    
    return {
      statusCode: 400,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details
    };
  }
  
  // Handle Mongoose cast errors
  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      message: 'Invalid data format',
      code: 'CAST_ERROR'
    };
  }
  
  // Handle Mongoose duplicate key errors
  if (error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
    const mongoError = error as any;
    const field = Object.keys(mongoError.keyPattern || {})[0] || 'field';
    return {
      statusCode: 409,
      message: `${field} already exists`,
      code: 'DUPLICATE_ERROR'
    };
  }
  
  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    };
  }
  
  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    };
  }
  
  // Handle multer errors
  if (error.name === 'MulterError') {
    const multerError = error as any;
    if (multerError.code === 'LIMIT_FILE_SIZE') {
      return {
        statusCode: 413,
        message: 'File too large',
        code: 'FILE_TOO_LARGE'
      };
    }
    if (multerError.code === 'LIMIT_FILE_COUNT') {
      return {
        statusCode: 413,
        message: 'Too many files',
        code: 'TOO_MANY_FILES'
      };
    }
    if (multerError.code === 'LIMIT_UNEXPECTED_FILE') {
      return {
        statusCode: 400,
        message: 'Unexpected file field',
        code: 'UNEXPECTED_FILE'
      };
    }
  }
  
  // Handle syntax errors
  if (error instanceof SyntaxError) {
    return {
      statusCode: 400,
      message: 'Invalid JSON syntax',
      code: 'SYNTAX_ERROR'
    };
  }
  
  // Default to internal server error
  return {
    statusCode: 500,
    message: process.env['NODE_ENV'] === 'production' 
      ? 'Internal server error' 
      : error.message,
    code: 'INTERNAL_ERROR'
  };
};

// Main error handling middleware
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const { statusCode, message, code, details } = handleError(error);
  
  // Log error details
  const errorMetadata = {
    statusCode,
    code,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    requestId: (req as any).requestId,
    body: req.body,
    query: req.query,
    params: req.params
  };
  
  if (statusCode >= 500) {
    logError('Server Error', error, errorMetadata);
  } else if (statusCode >= 400) {
    logger.warn({
      message: 'Client Error',
      error: message,
      ...errorMetadata
    });
  }
  
  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: {
      message,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId: (req as any).requestId
    }
  };
  
  // Include details in development or for validation errors
  if (details && (process.env['NODE_ENV'] === 'development' || statusCode === 400)) {
    errorResponse.error.details = details;
  }
  
  // Include stack trace in development
  if (process.env['NODE_ENV'] === 'development') {
    (errorResponse.error as any).stack = error.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

// Graceful error handling for unhandled promise rejections
export const handleUnhandledRejection = (reason: any, promise: Promise<any>): void => {
  logError('Unhandled Promise Rejection', reason instanceof Error ? reason : new Error(String(reason)), {
    promise: promise.toString()
  });
  
  // In production, we might want to restart the process
  if (process.env['NODE_ENV'] === 'production') {
    process.exit(1);
  }
};

// Graceful error handling for uncaught exceptions
export const handleUncaughtException = (error: Error): void => {
  logError('Uncaught Exception', error);
  
  // Always exit on uncaught exceptions
  process.exit(1);
};