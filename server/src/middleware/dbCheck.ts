import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { isDatabaseConnected, getDatabaseStatus } from '../config/database.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Ensures MongoDB is connected before attempting any database operations.
 * Returns HTTP 503 Service Unavailable if unconfigured or offline.
 */
export function requireDatabase(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isDatabaseConnected()) {
    const status = getDatabaseStatus();
    const message =
      status === 'unconfigured'
        ? 'Database service unavailable: MONGODB_URI is not configured.'
        : 'Database service unavailable: MongoDB Atlas connection is currently disconnected.';

    ApiResponse.error(res, message, 503, {
      databaseStatus: status,
      recommendation:
        status === 'unconfigured'
          ? 'Add MONGODB_URI to your .env file to enable persistence.'
          : 'Check your MongoDB Atlas network access rules and credentials.',
    });
    return;
  }
  next();
}

/**
 * Validates that a route parameter is a valid 24-character hexadecimal MongoDB ObjectId.
 * Returns HTTP 400 Bad Request if invalid.
 */
export function validateObjectId(paramName = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rawId = req.params[paramName];
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id) || String(new mongoose.Types.ObjectId(id)) !== id) {
      ApiResponse.error(
        res,
        `Validation failed: '${paramName}' must be a valid 24-character hexadecimal ObjectId.`,
        400
      );
      return;
    }
    next();
  };
}
