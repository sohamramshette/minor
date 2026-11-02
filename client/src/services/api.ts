import axios from 'axios';
import {
  BackendHealth,
  ApiRepository,
  ApiCommit,
  ApiAnalysis,
  PaginatedResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // Ingestion might take several seconds for GitHub API calls
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchHealthStatus(): Promise<BackendHealth> {
  try {
    const response = await api.get('/health');
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return { status: 'degraded' };
  } catch (error) {
    return { status: 'offline' };
  }
}

export async function fetchRepositories(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ApiRepository>> {
  const response = await api.get('/repositories', { params });
  return response.data.data;
}

export async function fetchRepositoryById(id: string): Promise<ApiRepository> {
  const response = await api.get(`/repositories/${id}`);
  return response.data.data;
}

export async function fetchRepositoryCommits(
  id: string,
  params?: {
    riskLevel?: string;
    sentimentTone?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedResponse<ApiCommit>> {
  const response = await api.get(`/repositories/${id}/commits`, { params });
  return response.data.data;
}

export async function fetchAnalyses(params?: {
  repositoryId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ApiAnalysis>> {
  const response = await api.get('/analyses', { params });
  return response.data.data;
}

export async function fetchAnalysisById(id: string): Promise<ApiAnalysis> {
  const response = await api.get(`/analyses/${id}`);
  return response.data.data;
}

export async function registerRepository(data: {
  fullName: string;
  githubUrl: string;
  owner?: string;
  name?: string;
  defaultBranch?: string;
  metadata?: Record<string, any>;
}): Promise<ApiRepository> {
  const response = await api.post('/repositories', data);
  return response.data.data;
}

export interface IngestionResult {
  repository: ApiRepository;
  analysis: ApiAnalysis;
  commitsIngested: number;
  totalCommits: number;
  batchSize: number;
}

/**
 * Phase 3: Initiate real GitHub repository metadata and commits ingestion.
 */
export async function analyzeRepository(data: {
  url: string;
  branch?: string;
  maxCommits?: number;
}): Promise<IngestionResult> {
  const response = await api.post('/repositories/analyze', data);
  return response.data.data;
}

export default api;
