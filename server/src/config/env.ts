import dotenv from 'dotenv';
import path from 'path';
import { AppConfig } from '../types/index.js';

// Load environment variables from .env if present
dotenv.config();

const portNumber = parseInt(process.env.PORT || '5000', 10);

export const config: AppConfig = {
  port: isNaN(portNumber) ? 5000 : portNumber,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI?.trim() || undefined,
  githubToken: process.env.GITHUB_TOKEN?.trim() || undefined,
};
