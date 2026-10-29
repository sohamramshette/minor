import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse.js';
import { getDatabaseStatus, getDatabaseDetails } from '../config/database.js';
import { config } from '../config/env.js';
import { HealthCheckData } from '../types/index.js';

const startTime = Date.now();

export function getHealthStatus(req: Request, res: Response): void {
  const memory = process.memoryUsage();
  const dbStatus = getDatabaseStatus();
  const dbDetails = getDatabaseDetails();
  const githubStatus = config.githubToken ? 'configured' : 'unconfigured';

  // Degraded if MongoDB URI was configured but failed to connect
  const isDegraded = config.mongoUri && dbStatus !== 'connected';

  const healthData: HealthCheckData = {
    status: isDegraded ? 'degraded' : 'ok',
    name: 'EmotionTrace Backend API',
    version: '1.0.0',
    phase: 'Phase 2 - MongoDB Atlas Integration',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    environment: config.nodeEnv,
    services: {
      database: dbStatus,
      github: githubStatus,
    },
    databaseDetails: dbDetails,
    memoryUsage: {
      rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
    },
  };

  const message =
    dbStatus === 'connected'
      ? 'EmotionTrace API is operating normally with MongoDB Atlas connected.'
      : dbStatus === 'unconfigured'
      ? 'EmotionTrace API is operating normally in standalone development mode.'
      : 'EmotionTrace API is operating with degraded database connectivity.';

  ApiResponse.success(res, healthData, message);
}
