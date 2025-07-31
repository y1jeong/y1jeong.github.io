import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = (): string => {
  const env = process.env['NODE_ENV'] || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info['timestamp']} ${info['level']}: ${info['message']}`
  )
);

const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [];

// Console transport for all environments
transports.push(
  new winston.transports.Console({
    format: process.env['NODE_ENV'] === 'production' ? productionFormat : developmentFormat
  })
);

// File transports for production
if (process.env['NODE_ENV'] === 'production') {
  // Ensure logs directory exists
  const logsDir = path.join(__dirname, '../../logs');
  
  // All logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'all.log'),
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
  
  // Error logs only
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false
});

// Create a stream object for Morgan HTTP logging
export const loggerStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  }
};

// Helper functions for structured logging
export const logError = (message: string, error?: Error, metadata?: Record<string, any>): void => {
  const logData: Record<string, any> = {
    message,
    ...metadata
  };
  
  if (error) {
    logData['error'] = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  
  logger.error(logData);
};

export const logInfo = (message: string, metadata?: Record<string, any>): void => {
  logger.info({ message, ...metadata });
};

export const logWarn = (message: string, metadata?: Record<string, any>): void => {
  logger.warn({ message, ...metadata });
};

export const logDebug = (message: string, metadata?: Record<string, any>): void => {
  logger.debug({ message, ...metadata });
};

// Performance logging helper
export const logPerformance = (operation: string, startTime: number, metadata?: Record<string, any>): void => {
  const duration = Date.now() - startTime;
  logger.info({
    message: `Performance: ${operation}`,
    duration: `${duration}ms`,
    ...metadata
  });
};

// Request logging helper
export const logRequest = (method: string, url: string, statusCode: number, responseTime: number, userId?: string): void => {
  logger.http({
    message: 'HTTP Request',
    method,
    url,
    statusCode,
    responseTime: `${responseTime}ms`,
    userId
  });
};

// Database operation logging
export const logDatabaseOperation = (operation: string, collection: string, duration: number, success: boolean, error?: Error): void => {
  const logData: Record<string, any> = {
    message: `Database ${operation}`,
    collection,
    duration: `${duration}ms`,
    success
  };
  
  if (error) {
    logData['error'] = {
      name: error.name,
      message: error.message
    };
  }
  
  if (success) {
    logger.info(logData);
  } else {
    logger.error(logData);
  }
};

// Image processing logging
export const logImageProcessing = (operation: string, filename: string, fileSize: number, duration: number, success: boolean, error?: Error): void => {
  const logData: Record<string, any> = {
    message: `Image Processing: ${operation}`,
    filename,
    fileSize: `${fileSize} bytes`,
    duration: `${duration}ms`,
    success
  };
  
  if (error) {
    logData['error'] = {
      name: error.name,
      message: error.message
    };
  }
  
  if (success) {
    logger.info(logData);
  } else {
    logger.error(logData);
  }
};

// Export default logger
export default logger;