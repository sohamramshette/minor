export interface ApiResponseStructure<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
  timestamp: string;
}

export type DatabaseConnectionState =
  | 'connected'
  | 'disconnected'
  | 'unconfigured'
  | 'connecting'
  | 'error';

export interface ServiceHealthStatus {
  database: 'connected' | 'disconnected' | 'unconfigured';
  github: 'configured' | 'unconfigured';
}

export interface HealthCheckData {
  status: 'ok' | 'degraded';
  name: string;
  version: string;
  phase: string;
  uptimeSeconds: number;
  environment: string;
  services: ServiceHealthStatus;
  databaseDetails?: {
    connected: boolean;
    readyState: number;
    host?: string;
    databaseName?: string;
  };
  memoryUsage: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
  };
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  clientUrl: string;
  mongoUri?: string;
  githubToken?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}
