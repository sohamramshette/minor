import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';
import { ServiceHealthStatus, DatabaseConnectionState } from '../types/index.js';

let isListenersRegistered = false;

function registerConnectionListeners(): void {
  if (isListenersRegistered) return;
  isListenersRegistered = true;

  mongoose.connection.on('connected', () => {
    const host = mongoose.connection.host || 'unknown-host';
    const dbName = mongoose.connection.name || 'default';
    logger.info(`[Database] MongoDB Atlas connected to ${host}/${dbName}`);
  });

  mongoose.connection.on('error', (err) => {
    logger.error('[Database] MongoDB connection error:', err.message || err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('[Database] MongoDB disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('[Database] MongoDB reconnected successfully.');
  });
}

/**
 * Connect to MongoDB Atlas using MONGODB_URI.
 * Falls back gracefully to standalone mode if MONGODB_URI is absent.
 * Catches connection errors to prevent unexpected server termination.
 */
export async function connectDatabase(customUri?: string): Promise<boolean> {
  const uri = customUri || config.mongoUri;

  if (!uri) {
    logger.info('[Database] MONGODB_URI is not set. Standalone development mode active.');
    return false;
  }

  registerConnectionListeners();

  try {
    logger.info('[Database] Initiating connection to MongoDB...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout fast instead of hanging
      connectTimeoutMS: 10000,
    });
    return true;
  } catch (error: any) {
    logger.error(
      `[Database] Failed to establish MongoDB Atlas connection: ${error?.message || error}. Continuing in offline/degraded mode.`
    );
    return false;
  }
}

/**
 * Disconnect from MongoDB gracefully.
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      logger.info('[Database] MongoDB disconnected cleanly.');
    } catch (error) {
      logger.error('[Database] Error while disconnecting from MongoDB:', error);
    }
  }
}

/**
 * Check if MongoDB is connected and ready to process queries.
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Returns formatted status for health checks.
 * Only returns 'connected' if readyState is 1 (connected).
 */
export function getDatabaseStatus(): ServiceHealthStatus['database'] {
  if (!config.mongoUri && mongoose.connection.readyState === 0) {
    return 'unconfigured';
  }
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

/**
 * Detailed connection state for telemetry and diagnostics.
 */
export function getDatabaseDetails(): {
  connected: boolean;
  readyState: number;
  host?: string;
  databaseName?: string;
} {
  const isConnected = mongoose.connection.readyState === 1;
  return {
    connected: isConnected,
    readyState: mongoose.connection.readyState,
    ...(isConnected
      ? {
          host: mongoose.connection.host,
          databaseName: mongoose.connection.name,
        }
      : {}),
  };
}
