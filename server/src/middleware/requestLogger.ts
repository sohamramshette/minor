import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logText = `${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`;
    if (res.statusCode >= 400) {
      logger.warn(logText);
    } else {
      logger.info(logText);
    }
  });

  next();
}
