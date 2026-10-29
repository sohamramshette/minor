import { Octokit } from 'octokit';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let octokitInstance: Octokit | null = null;

export function getOctokitClient(): Octokit {
  if (!octokitInstance) {
    octokitInstance = new Octokit({
      auth: config.githubToken || undefined,
    });
    if (config.githubToken) {
      logger.info('[GitHub] Octokit initialized with personal access token.');
    } else {
      logger.warn('[GitHub] Octokit initialized in unauthenticated mode (rate limits apply).');
    }
  }
  return octokitInstance;
}
