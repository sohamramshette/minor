process.env.NODE_ENV = 'test';
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/server.js';
import {
  connectDatabase,
  disconnectDatabase,
} from '../src/config/database.js';
import { Repository } from '../src/models/Repository.js';
import { Commit } from '../src/models/Commit.js';
import { Analysis } from '../src/models/Analysis.js';
import {
  parseGitHubUrl,
  setOctokitClient,
} from '../src/services/githubService.js';
import type { Octokit } from 'octokit';

describe('Phase 3 — Real GitHub Repository Integration & Ingestion', () => {
  let mongoServer: MongoMemoryServer;
  let server: Server;
  let baseUrl: string;

  const defaultCommits = [
    {
      sha: 'a1b2c3d4e5f678901234567890abcdef12345678',
      commit: {
        message: 'fix(hooks): resolve memory leak in useEffect cleanup',
        author: {
          name: 'Dan Abramov',
          email: 'dan@example.com',
          date: '2026-10-20T14:30:00Z',
        },
      },
      author: {
        login: 'gaearon',
        avatar_url: 'https://avatars.githubusercontent.com/u/810438',
      },
    },
    {
      sha: 'b2c3d4e5f678901234567890abcdef1234567890',
      commit: {
        message: 'feat(compiler): enable automatic memoization optimizations',
        author: {
          name: 'Sophie Alpert',
          email: 'sophie@example.com',
          date: '2026-10-18T10:15:00Z',
        },
      },
      author: {
        login: 'sophiebits',
        avatar_url: 'https://avatars.githubusercontent.com/u/6820',
      },
    },
    {
      sha: 'c3d4e5f678901234567890abcdef123456789012',
      commit: {
        message: 'docs: update concurrent mode migration guide',
        author: {
          name: 'Rachel Nabors',
          email: 'rachel@example.com',
          date: '2026-10-15T09:00:00Z',
        },
      },
      author: {
        login: 'rachelnabors',
        avatar_url: 'https://avatars.githubusercontent.com/u/123456',
      },
    },
  ];

  function createMockOctokit(opts?: {
    repoMetadata?: any;
    commitsList?: any[];
    commitDetailsMap?: Record<string, any>;
    metadataError?: any;
    commitsListError?: any;
    commitDetailError?: any;
  }) {
    const commitsToReturn = opts?.commitsList !== undefined ? opts.commitsList : defaultCommits;

    return {
      rest: {
        repos: {
          get: async ({ owner, repo }: any) => {
            if (opts?.metadataError) throw opts.metadataError;
            return {
              data: opts?.repoMetadata || {
                id: 10270250,
                name: repo,
                full_name: `${owner}/${repo}`,
                owner: { login: owner },
                html_url: `https://github.com/${owner}/${repo}`,
                description: 'The React library for web and native user interfaces',
                default_branch: 'main',
                language: 'JavaScript',
                stargazers_count: 228000,
                forks_count: 45000,
                open_issues_count: 850,
                size: 154000,
                topics: ['react', 'ui', 'frontend'],
                private: false,
              },
            };
          },
          listCommits: async ({ owner, repo, sha, per_page }: any) => {
            if (opts?.commitsListError) throw opts.commitsListError;
            return {
              data: commitsToReturn,
            };
          },
          getCommit: async ({ owner, repo, ref }: any) => {
            if (opts?.commitDetailError) throw opts.commitDetailError;
            if (opts?.commitDetailsMap && opts.commitDetailsMap[ref]) {
              return { data: opts.commitDetailsMap[ref] };
            }
            const matched = commitsToReturn.find((c: any) => c.sha === ref);
            return {
              data: {
                sha: ref,
                stats: { additions: 84, deletions: 26, total: 110 },
                files: [
                  { filename: 'packages/react/src/ReactHooks.js', additions: 50, deletions: 10 },
                  { filename: 'packages/react-reconciler/src/ReactFiberHooks.js', additions: 34, deletions: 16 },
                ],
                commit: {
                  message: matched?.commit?.message || 'Commit details for ' + ref,
                  author: matched?.commit?.author || {
                    name: 'Dan Abramov',
                    email: 'dan@example.com',
                    date: '2026-10-20T14:30:00Z',
                  },
                },
              },
            };
          },
        },
      },
    } as unknown as Octokit;
  }

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectDatabase(uri);

    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    setOctokitClient(null);
    await disconnectDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(async () => {
    // Reset collections between tests
    await Repository.deleteMany({});
    await Commit.deleteMany({});
    await Analysis.deleteMany({});
    setOctokitClient(null);
  });

  describe('1. GitHub URL Parsing & Validation', () => {
    test('parses standard HTTPS GitHub repository URLs', () => {
      const parsed = parseGitHubUrl('https://github.com/facebook/react');
      assert.deepEqual(parsed, { owner: 'facebook', repo: 'react' });
    });

    test('parses URLs with trailing slashes and .git extensions', () => {
      const parsed = parseGitHubUrl('https://github.com/facebook/react.git/');
      assert.deepEqual(parsed, { owner: 'facebook', repo: 'react' });
    });

    test('parses HTTP and www prefixed URLs', () => {
      const parsed = parseGitHubUrl('http://www.github.com/pallets/flask');
      assert.deepEqual(parsed, { owner: 'pallets', repo: 'flask' });
    });

    test('parses shorthand owner/repo notation', () => {
      const parsed = parseGitHubUrl('torvalds/linux');
      assert.deepEqual(parsed, { owner: 'torvalds', repo: 'linux' });
    });

    test('parses SSH Git URLs', () => {
      const parsed = parseGitHubUrl('git@github.com:expressjs/express.git');
      assert.deepEqual(parsed, { owner: 'expressjs', repo: 'express' });
    });

    test('rejects non-GitHub domains', () => {
      assert.equal(parseGitHubUrl('https://gitlab.com/owner/repo'), null);
      assert.equal(parseGitHubUrl('https://bitbucket.org/owner/repo'), null);
      assert.equal(parseGitHubUrl('https://google.com'), null);
    });

    test('rejects empty, malformed, or incomplete URLs', () => {
      assert.equal(parseGitHubUrl(''), null);
      assert.equal(parseGitHubUrl('   '), null);
      assert.equal(parseGitHubUrl('https://github.com/onlyowner'), null);
      assert.equal(parseGitHubUrl('not-a-repo-path'), null);
    });
  });

  describe('2. POST /api/repositories/analyze Endpoint Validation', () => {
    test('returns 400 when url parameter is missing', async () => {
      const res = await fetch(`${baseUrl}/api/repositories/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.message.includes('required'));
    });

    test('returns 400 when url format is invalid', async () => {
      const res = await fetch(`${baseUrl}/api/repositories/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://notgithub.com/someone/somerepo' }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.message.includes('Invalid GitHub repository URL format'));
    });
  });

  describe('3. Successful Ingestion & MongoDB Persistence', () => {
    test('ingests repository metadata, commits, and logs analysis run', async () => {
      setOctokitClient(createMockOctokit());

      const res = await fetch(`${baseUrl}/api/repositories/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://github.com/facebook/react',
          branch: 'main',
          maxCommits: 30,
        }),
      });

      assert.equal(res.status, 200);
      const payload = await res.json();
      assert.equal(payload.success, true);
      assert.equal(payload.data.commitsIngested, 3);
      assert.equal(payload.data.totalCommits, 3);
      assert.equal(payload.data.repository.fullName, 'facebook/react');
      assert.equal(payload.data.repository.status, 'completed');

      // Verify repository in MongoDB
      const storedRepo = await Repository.findOne({ fullName: 'facebook/react' });
      assert.ok(storedRepo);
      assert.equal(storedRepo.owner, 'facebook');
      assert.equal(storedRepo.name, 'react');
      assert.equal(storedRepo.metadata.language, 'JavaScript');
      assert.equal(storedRepo.metadata.stars, 228000);
      assert.equal(storedRepo.status, 'completed');
      assert.ok(storedRepo.analyzedAt);

      // Verify commits in MongoDB
      const storedCommits = await Commit.find({ repositoryId: storedRepo._id });
      assert.equal(storedCommits.length, 3);

      const firstCommit = storedCommits.find(
        (c) => c.hash === 'a1b2c3d4e5f678901234567890abcdef12345678'
      );
      assert.ok(firstCommit);
      assert.equal(firstCommit.shortHash, 'a1b2c3d');
      assert.equal(firstCommit.author.name, 'Dan Abramov');
      assert.equal(firstCommit.author.email, 'dan@example.com');
      assert.equal(firstCommit.churn.insertions, 84);
      assert.equal(firstCommit.churn.deletions, 26);
      assert.equal(firstCommit.churn.filesCount, 2);
      assert.ok(firstCommit.changedFiles?.includes('packages/react/src/ReactHooks.js'));
      assert.equal(firstCommit.status, 'pending');

      // Verify Analysis history in MongoDB
      const storedAnalysis = await Analysis.findOne({ repositoryId: storedRepo._id });
      assert.ok(storedAnalysis);
      assert.equal(storedAnalysis.status, 'completed');
      assert.equal(storedAnalysis.summaryMetrics?.totalCommits, 3);
      assert.ok(typeof storedAnalysis.durationMs === 'number');
    });

    test('prevents duplicate commits when re-analyzing the same repository', async () => {
      setOctokitClient(createMockOctokit());

      // Ingestion Run 1
      const res1 = await fetch(`${baseUrl}/api/repositories/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://github.com/facebook/react' }),
      });
      assert.equal(res1.status, 200);
      const data1 = await res1.json();
      assert.equal(data1.data.commitsIngested, 3);

      // Ingestion Run 2 (Same commits)
      const res2 = await fetch(`${baseUrl}/api/repositories/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://github.com/facebook/react' }),
      });
      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.equal(data2.data.commitsIngested, 0); // 0 new commits
      assert.equal(data2.data.totalCommits, 3); // Total remains 3

      // Verify exact count in MongoDB collection
      const repo = await Repository.findOne({ fullName: 'facebook/react' });
      assert.ok(repo);
      const commitCount = await Commit.countDocuments({ repositoryId: repo._id });
      assert.equal(commitCount, 3);
    });
  });

  describe('4. GitHub API Error Handling', () => {
    test('returns 404 when repository does not exist on GitHub', async () => {
      const mockClient = createMockOctokit({
        metadataError: { status: 404, message: 'Not Found' },
      });
      setOctokitClient(mockClient);

      const res = await fetch(`${baseUrl}/api/repositories/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://github.com/nonexistent-org/ghost-repo' }),
      });

      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.message.includes('not found'));
    });

    test('returns 403 when GitHub rate limit is exceeded', async () => {
      const mockClient = createMockOctokit({
        metadataError: {
          status: 403,
          message: 'API rate limit exceeded for 127.0.0.1. (But here is the good news: Authenticated requests get a higher rate limit.)',
          response: {
            headers: { 'x-ratelimit-remaining': '0' },
          },
        },
      });
      setOctokitClient(mockClient);

      const res = await fetch(`${baseUrl}/api/repositories/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://github.com/facebook/react' }),
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.message.toLowerCase().includes('rate limit'));
    });
  });

  describe('5. Edge Cases & Filtering', () => {
    test('handles empty repository with 0 commits gracefully', async () => {
      const mockClient = createMockOctokit({
        commitsList: [],
      });
      setOctokitClient(mockClient);

      const res = await fetch(`${baseUrl}/api/repositories/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://github.com/empty-user/empty-repo' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.data.commitsIngested, 0);
      assert.equal(data.data.totalCommits, 0);

      const repo = await Repository.findOne({ fullName: 'empty-user/empty-repo' });
      assert.ok(repo);
      assert.equal(repo.status, 'completed');
    });

    test('GET /api/repositories/:id/commits supports search filter and pagination', async () => {
      setOctokitClient(createMockOctokit());

      // Ingest 3 commits
      const analyzeRes = await fetch(`${baseUrl}/api/repositories/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://github.com/facebook/react' }),
      });
      const analyzeData = await analyzeRes.json();
      const repoId = analyzeData.data.repository._id;

      // 1. Pagination check
      const pageRes = await fetch(
        `${baseUrl}/api/repositories/${repoId}/commits?page=1&limit=2`
      );
      assert.equal(pageRes.status, 200);
      const pageData = await pageRes.json();
      assert.equal(pageData.data.items.length, 2);
      assert.equal(pageData.data.pagination.total, 3);
      assert.equal(pageData.data.pagination.totalPages, 2);
      assert.equal(pageData.data.pagination.hasNext, true);

      // 2. Search check (searching for "leak")
      const searchRes = await fetch(
        `${baseUrl}/api/repositories/${repoId}/commits?search=leak`
      );
      assert.equal(searchRes.status, 200);
      const searchData = await searchRes.json();
      assert.equal(searchData.data.items.length, 1);
      assert.ok(searchData.data.items[0].message.includes('memory leak'));
    });
  });
});
