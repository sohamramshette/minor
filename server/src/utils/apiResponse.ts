import { Response } from 'express';
import { ApiResponseStructure } from '../types/index.js';

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Request successful',
    statusCode = 200
  ): Response {
    const payload: ApiResponseStructure<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }

  static error(
    res: Response,
    message = 'Internal server error',
    statusCode = 500,
    error: unknown = null
  ): Response {
    const payload: ApiResponseStructure = {
      success: false,
      message,
      ...(error ? { error } : {}),
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }
}
