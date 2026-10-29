import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';
import { logger } from './utils/logger.js';

export function createApp(): Express {
  const app = express();

  // CORS restricted to configured client origin
  const allowedOrigins = [
    config.clientUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body Parsing Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP Request Logging
  app.use(requestLogger);

  // Root redirect / quick welcome
  app.get('/', (req, res) => {
    res.json({
      project: 'EmotionTrace',
      title: 'AI-Powered Bug Origin Prediction Using Developer Sentiment and Git History',
      healthEndpoint: '/api/health',
      version: '1.0.0',
      phase: 1,
    });
  });

  // API Routes
  app.use('/api', apiRouter);

  // 404 Handler
  app.use(notFoundHandler);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}

export async function startServer(): Promise<void> {
  const app = createApp();

  // Initialize database connection (graceful fallback in Phase 1)
  await connectDatabase();

  const server = app.listen(config.port, () => {
    logger.info(`=======================================================`);
    logger.info(` EmotionTrace Server running on port ${config.port}`);
    logger.info(` Environment: ${config.nodeEnv}`);
    logger.info(` Frontend Origin: ${config.clientUrl}`);
    logger.info(` Health Check: http://localhost:${config.port}/api/health`);
    logger.info(`=======================================================`);
  });

  const gracefulShutdown = async () => {
    logger.info('[Server] Received kill signal, shutting down gracefully...');
    await disconnectDatabase();
    server.close(() => {
      logger.info('[Server] Closed remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

// Start if executed directly as entrypoint
const isMain = Boolean(
  process.argv[1] &&
    (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'))
);

if (isMain && process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    logger.error('[Server] Fatal startup error:', err);
    process.exit(1);
  });
}
