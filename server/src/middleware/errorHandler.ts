import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  ApiResponse.error(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const statusCode = 'statusCode' in err && typeof err.statusCode === 'number'
    ? err.statusCode
    : 500;

  const message = err.message || 'An unexpected error occurred';
  const details = 'details' in err ? err.details : undefined;

  logger.error(`[Error] ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);
  if (statusCode === 500 && process.env.NODE_ENV !== 'production') {
    logger.error(err.stack || String(err));
  }

  ApiResponse.error(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? (details || { stack: err.stack }) : details
  );
}
