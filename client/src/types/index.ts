export type NavigationTab =
  | 'overview'
  | 'repository'
  | 'commits'
  | 'risk'
  | 'sentiment'
  | 'investigation'
  | 'reports';

export interface BackendHealth {
  status: 'ok' | 'degraded' | 'offline';
  name?: string;
  version?: string;
  phase?: string;
  uptimeSeconds?: number;
  environment?: string;
  services?: {
    database: 'connected' | 'disconnected' | 'unconfigured';
    github: 'configured' | 'unconfigured';
  };
  databaseDetails?: {
    connected: boolean;
    readyState: number;
    host?: string;
    databaseName?: string;
  };
  memoryUsage?: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
  };
}

export type SentimentTone =
  | 'frustrated'
  | 'negative'
  | 'neutral'
  | 'positive'
  | 'urgent';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

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

export interface ApiRepository {
  id: string;
  _id?: string;
  fullName: string;
  githubUrl: string;
  owner: string;
  name: string;
  defaultBranch: string;
  status: 'idle' | 'pending' | 'analyzing' | 'completed' | 'failed';
  metadata: {
    description?: string;
    language?: string;
    stars?: number;
    forks?: number;
    openIssues?: number;
    sizeKb?: number;
    topics?: string[];
    isPrivate?: boolean;
  };
  commitCount?: number;
  analyzedAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCommit {
  id: string;
  _id?: string;
  repositoryId: string;
  hash: string;
  shortHash: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
    avatarUrl?: string;
  };
  authoredDate: string;
  branch: string;
  churn: {
    insertions: number;
    deletions: number;
    filesCount: number;
  };
  sentiment?: {
    score: number;
    tone: SentimentTone;
    confidence: number;
    keywords: string[];
    stressIndicator: number;
  };
  bugRisk?: {
    probability: number;
    level: RiskLevel;
    factors: string[];
  };
  isInducingCandidate?: boolean;
  status: 'pending' | 'analyzed' | 'skipped';
  createdAt: string;
  updatedAt: string;
}

export interface ApiAnalysis {
  id: string;
  _id?: string;
  repositoryId: string | ApiRepository;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  branch: string;
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  summaryMetrics?: {
    totalCommits: number;
    highRiskCommits: number;
    averageStressIndex: number;
    correlationScore: number;
    detectedBugOrigins: number;
    mlAccuracy?: string;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoCommit {
  id: string;
  hash: string;
  shortHash: string;
  author: string;
  avatar: string;
  date: string;
  timeAgo: string;
  message: string;
  branch: string;
  churn: {
    insertions: number;
    deletions: number;
    filesCount: number;
  };
  sentiment: {
    score: number;
    tone: SentimentTone;
    confidence: number;
    keywords: string[];
    stressIndicator: number;
  };
  risk: {
    probability: number;
    level: RiskLevel;
    factors: string[];
  };
  isInducingCommitCandidate?: boolean;
}

export interface DemoBugReport {
  id: string;
  ticketId: string;
  title: string;
  severity: 'Critical' | 'Major' | 'Minor';
  reportedDate: string;
  fixedInCommit: string;
  suspectedOriginCommit: string;
  confidenceScore: number;
  developerSentimentAtOrigin: SentimentTone;
  summary: string;
}

export interface SentimentTimePoint {
  date: string;
  sentimentScore: number;
  stressLevel: number;
  bugCount: number;
  commitCount: number;
}
