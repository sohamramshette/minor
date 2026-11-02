import type { Octokit } from 'octokit';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class GitHubError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'GitHubError';
    this.statusCode = statusCode;
  }
}

export class GitHubNotFoundError extends GitHubError {
  constructor(owner: string, repo: string) {
    super(
      `GitHub repository '${owner}/${repo}' was not found. Please verify the URL or ensure the repository is public.`,
      404
    );
    this.name = 'GitHubNotFoundError';
  }
}

export class GitHubRateLimitError extends GitHubError {
  constructor(message?: string) {
    super(
      message ||
        'GitHub API rate limit exceeded. Please configure a valid GITHUB_TOKEN environment variable or wait for the rate limit window to reset.',
      403
    );
    this.name = 'GitHubRateLimitError';
  }
}

export class GitHubAuthError extends GitHubError {
  constructor(message?: string) {
    super(
      message || 'GitHub API authentication failed. Please verify your GITHUB_TOKEN.',
      401
    );
    this.name = 'GitHubAuthError';
  }
}

export interface ParsedGitHubRepo {
  owner: string;
  repo: string;
}

export interface GitHubRepoMetadata {
  fullName: string;
  owner: string;
  name: string;
  githubUrl: string;
  defaultBranch: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  sizeKb: number;
  topics: string[];
  isPrivate: boolean;
}

export interface GitHubCommitData {
  hash: string;
  shortHash: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: Date;
    avatarUrl?: string;
  };
  authoredDate: Date;
  branch: string;
  churn: {
    insertions: number;
    deletions: number;
    filesCount: number;
  };
  changedFiles: string[];
}

let octokitInstance: Octokit | null = null;
let OctokitConstructor: typeof Octokit | null = null;

export async function getOctokitClient(): Promise<Octokit> {
  if (!octokitInstance) {
    if (!OctokitConstructor) {
      const octokitModule = await import('octokit');
      OctokitConstructor = octokitModule.Octokit;
    }
    octokitInstance = new OctokitConstructor({
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

export function setOctokitClient(client: Octokit | null): void {
  octokitInstance = client;
}

/**
 * Validates and parses GitHub repository URLs into owner and repo names.
 * Accepts:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - http://github.com/owner/repo/
 * - github.com/owner/repo
 * - owner/repo
 * - git@github.com:owner/repo.git
 */
export function parseGitHubUrl(input: string): ParsedGitHubRepo | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. SSH format: git@github.com:owner/repo(.git)?
  const sshMatch = trimmed.match(
    /^git@github\.com:([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?\/?$/
  );
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2].replace(/\.git$/, '') };
  }

  // 2. HTTP/HTTPS GitHub URLs
  const webMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?(?:\/.*)?$/
  );
  if (webMatch) {
    const owner = webMatch[1];
    const repo = webMatch[2].replace(/\.git$/, '');
    if (owner && repo) {
      return { owner, repo };
    }
  }

  // 3. Shorthand: owner/repo
  if (
    !trimmed.includes('://') &&
    !trimmed.includes('@') &&
    !trimmed.includes(' ') &&
    !trimmed.includes('?') &&
    !trimmed.includes('#')
  ) {
    const parts = trimmed.split('/').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      const [owner, rawRepo] = parts;
      const repo = rawRepo.replace(/\.git$/, '');
      const validName = /^[a-zA-Z0-9_.-]+$/;
      if (validName.test(owner) && validName.test(repo) && !owner.includes('.')) {
        return { owner, repo };
      }
    }
  }

  return null;
}

function handleOctokitError(error: any, owner: string, repo: string): never {
  const status = error.status || error.response?.status;
  const message = error.message || '';

  if (status === 404) {
    throw new GitHubNotFoundError(owner, repo);
  }
  if (status === 403 || status === 429) {
    if (
      message.toLowerCase().includes('rate limit') ||
      error.response?.headers?.['x-ratelimit-remaining'] === '0'
    ) {
      throw new GitHubRateLimitError();
    }
    throw new GitHubError(`GitHub API access forbidden: ${message}`, 403);
  }
  if (status === 401) {
    throw new GitHubAuthError();
  }

  throw new GitHubError(`GitHub API error: ${message}`, status || 500);
}

/**
 * Fetches repository metadata from GitHub REST API.
 */
export async function fetchRepositoryMetadata(
  owner: string,
  repo: string,
  client?: Octokit
): Promise<GitHubRepoMetadata> {
  const octokit = client || (await getOctokitClient());
  try {
    const response = await octokit.rest.repos.get({
      owner,
      repo,
    });
    const data = response.data;

    return {
      fullName: `${data.owner.login}/${data.name}`.toLowerCase(),
      owner: data.owner.login,
      name: data.name,
      githubUrl: data.html_url || `https://github.com/${owner}/${repo}`,
      defaultBranch: data.default_branch || 'main',
      description: data.description || '',
      language: data.language || 'Unknown',
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      openIssues: data.open_issues_count ?? 0,
      sizeKb: data.size ?? 0,
      topics: (data as any).topics ?? [],
      isPrivate: data.private ?? false,
    };
  } catch (error) {
    handleOctokitError(error, owner, repo);
  }
}

/**
 * Fetches recent commit history and code churn details from GitHub REST API.
 */
export async function fetchRepositoryCommits(
  owner: string,
  repo: string,
  options?: { perPage?: number; branch?: string },
  client?: Octokit
): Promise<GitHubCommitData[]> {
  const octokit = client || (await getOctokitClient());
  const perPage = Math.min(100, Math.max(1, options?.perPage || 30));
  const branch = options?.branch || undefined;

  let commitListResponse;
  try {
    commitListResponse = await octokit.rest.repos.listCommits({
      owner,
      repo,
      sha: branch,
      per_page: perPage,
    });
  } catch (error) {
    handleOctokitError(error, owner, repo);
  }

  const rawCommits = commitListResponse.data || [];
  if (rawCommits.length === 0) {
    return [];
  }

  const enrichedCommits: GitHubCommitData[] = [];

  for (const item of rawCommits) {
    const sha = item.sha;
    let detailData: any = null;

    try {
      const detailRes = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: sha,
      });
      detailData = detailRes.data;
    } catch (err: any) {
      const status = err.status || err.response?.status;
      if (status === 403 || status === 429) {
        handleOctokitError(err, owner, repo);
      }
      logger.warn(`[GitHub] Could not fetch detailed commit stats for ${sha}: ${err.message}`);
    }

    const commitObj = detailData?.commit || item.commit;
    const authorDate = new Date(
      commitObj?.author?.date || commitObj?.committer?.date || Date.now()
    );

    const insertions = detailData?.stats?.additions ?? 0;
    const deletions = detailData?.stats?.deletions ?? 0;
    const files = (detailData?.files || []).map((f: any) => f.filename);
    const filesCount = files.length;

    enrichedCommits.push({
      hash: sha,
      shortHash: sha.substring(0, 7),
      message: commitObj?.message || '',
      author: {
        name: commitObj?.author?.name || detailData?.author?.login || item.author?.login || 'Unknown',
        email: commitObj?.author?.email || 'unknown@noreply.github.com',
        date: authorDate,
        avatarUrl: detailData?.author?.avatar_url || item.author?.avatar_url || '',
      },
      authoredDate: authorDate,
      branch: branch || 'main',
      churn: {
        insertions,
        deletions,
        filesCount,
      },
      changedFiles: files,
    });
  }

  return enrichedCommits;
}
