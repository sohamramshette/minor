process.env.NODE_ENV = 'test';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/server.js';
import {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  getDatabaseStatus,
} from '../src/config/database.js';
import { Repository } from '../src/models/Repository.js';
import { Commit } from '../src/models/Commit.js';
import { Analysis } from '../src/models/Analysis.js';

describe('MongoDB Atlas Persistence & REST API Endpoints', () => {
  let mongoServer: MongoMemoryServer;
  let server: Server;
  let baseUrl: string;
  let createdRepoId: string;
  let createdAnalysisId: string;

  before(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Connect via application connectDatabase
    const connected = await connectDatabase(uri);
    assert.equal(connected, true);

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
    await disconnectDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  test('Database connection status reports connected when online', () => {
    assert.equal(isDatabaseConnected(), true);
    assert.equal(getDatabaseStatus(), 'connected');
  });

  test('POST /api/repositories registers a new repository document', async () => {
    const res = await fetch(`${baseUrl}/api/repositories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'facebook/react',
        githubUrl: 'https://github.com/facebook/react',
        owner: 'facebook',
        name: 'react',
        defaultBranch: 'main',
        metadata: {
          description: 'The library for web and native user interfaces',
          language: 'JavaScript',
          stars: 228400,
          forks: 46200,
          openIssues: 840,
        },
      }),
    });

    assert.equal(res.status, 201);
    const payload = await res.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.fullName, 'facebook/react');
    assert.equal(payload.data.owner, 'facebook');
    assert.ok(payload.data.id || payload.data._id);

    createdRepoId = payload.data.id || payload.data._id;
  });

  test('POST /api/repositories rejects duplicate repository name with 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/api/repositories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'facebook/react',
        githubUrl: 'https://github.com/facebook/react',
      }),
    });

    assert.equal(res.status, 409);
    const payload = await res.json();
    assert.equal(payload.success, false);
    assert.ok(payload.message.includes('already exists') || payload.message.includes('already registered'));
  });

  test('Mongoose compound index prevents duplicate commits within the same repository', async () => {
    // Insert initial commit
    const commitData = {
      repositoryId: new mongoose.Types.ObjectId(createdRepoId),
      hash: 'a7f3b89e2c1409d582ea847391c01e9d3fa6e412',
      message: 'Quick dirty workaround for race condition in reconciler',
      author: {
        name: 'Alex Rivera',
        email: 'alex@example.com',
        date: new Date('2026-10-24T02:41:00Z'),
      },
      authoredDate: new Date('2026-10-24T02:41:00Z'),
      churn: {
        insertions: 342,
        deletions: 118,
        filesCount: 9,
      },
      sentiment: {
        score: -0.84,
        tone: 'frustrated',
        confidence: 0.94,
        keywords: ['dirty workaround', 'race condition'],
        stressIndicator: 92,
      },
      bugRisk: {
        probability: 0.91,
        level: 'critical',
        factors: ['Late night commit', 'Extreme negative sentiment'],
      },
      isInducingCandidate: true,
      status: 'analyzed',
    };

    const firstCommit = await Commit.create(commitData);
    assert.ok(firstCommit._id);

    // Ensure index is built in memory mongo
    await Commit.syncIndexes();

    // Inserting a commit with the identical hash in the same repository MUST throw duplicate key error
    await assert.rejects(
      async () => {
        await Commit.create({
          ...commitData,
          message: 'Duplicate commit hash attempt',
        });
      },
      (err: any) => {
        return err.code === 11000;
      }
    );

    // Insert a second distinct commit
    await Commit.create({
      repositoryId: new mongoose.Types.ObjectId(createdRepoId),
      hash: 'e81a94b3c7042a98ef114502d917ab41280f9831',
      message: 'Hotfix: emergency patch for memory leak',
      author: {
        name: 'Marcus Vance',
        email: 'marcus@example.com',
        date: new Date('2026-10-23T23:18:00Z'),
      },
      authoredDate: new Date('2026-10-23T23:18:00Z'),
      churn: { insertions: 88, deletions: 42, filesCount: 3 },
      sentiment: { score: -0.68, tone: 'urgent', confidence: 0.89, keywords: ['emergency patch'], stressIndicator: 84 },
      bugRisk: { probability: 0.83, level: 'high', factors: ['Urgent stress'] },
      isInducingCandidate: true,
      status: 'analyzed',
    });

    // Insert a third distinct commit
    await Commit.create({
      repositoryId: new mongoose.Types.ObjectId(createdRepoId),
      hash: '59c20a1ef8324810dc297e411b0129cf942718da',
      message: 'Refactor synthetic event pooling with verified benchmark suite',
      author: {
        name: 'Elena Rostova',
        email: 'elena@example.com',
        date: new Date('2026-10-22T14:15:00Z'),
      },
      authoredDate: new Date('2026-10-22T14:15:00Z'),
      churn: { insertions: 145, deletions: 190, filesCount: 6 },
      sentiment: { score: 0.72, tone: 'positive', confidence: 0.91, keywords: ['benchmark'], stressIndicator: 18 },
      bugRisk: { probability: 0.14, level: 'low', factors: ['High test coverage'] },
      isInducingCandidate: false,
      status: 'analyzed',
    });
  });

  test('GET /api/repositories retrieves stored repositories list with pagination', async () => {
    const res = await fetch(`${baseUrl}/api/repositories`);
    assert.equal(res.status, 200);

    const payload = await res.json();
    assert.equal(payload.success, true);
    assert.ok(Array.isArray(payload.data.items));
    assert.equal(payload.data.items.length, 1);
    assert.equal(payload.data.items[0].fullName, 'facebook/react');
    assert.equal(payload.data.pagination.total, 1);
    assert.equal(payload.data.pagination.page, 1);
  });

  test('GET /api/repositories/:id retrieves repository details', async () => {
    const res = await fetch(`${baseUrl}/api/repositories/${createdRepoId}`);
    assert.equal(res.status, 200);

    const payload = await res.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.fullName, 'facebook/react');
    assert.equal(payload.data.commitCount, 3);
  });

  test('GET /api/repositories/:id/commits retrieves paginated commits', async () => {
    const res = await fetch(`${baseUrl}/api/repositories/${createdRepoId}/commits?page=1&limit=2`);
    assert.equal(res.status, 200);

    const payload = await res.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.items.length, 2);
    assert.equal(payload.data.pagination.total, 3);
    assert.equal(payload.data.pagination.page, 1);
    assert.equal(payload.data.pagination.limit, 2);
    assert.equal(payload.data.pagination.totalPages, 2);
    assert.equal(payload.data.pagination.hasNext, true);
    assert.equal(payload.data.pagination.hasPrev, false);
  });

  test('GET /api/repositories/:id/commits supports riskLevel filtering', async () => {
    const res = await fetch(`${baseUrl}/api/repositories/${createdRepoId}/commits?riskLevel=critical`);
    assert.equal(res.status, 200);

    const payload = await res.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.items.length, 1);
    assert.equal(payload.data.items[0].bugRisk.level, 'critical');
  });

  test('GET /api/repositories/:id returns 400 for invalid ObjectId format', async () => {
    const res = await fetch(`${baseUrl}/api/repositories/invalid-id-12345`);
    assert.equal(res.status, 400);

    const payload = await res.json();
    assert.equal(payload.success, false);
    assert.ok(payload.message.includes('must be a valid 24-character hexadecimal ObjectId'));
  });

  test('GET /api/repositories/:id returns 404 for nonexistent valid ObjectId', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/api/repositories/${nonExistentId}`);
    assert.equal(res.status, 404);

    const payload = await res.json();
    assert.equal(payload.success, false);
    assert.ok(payload.message.includes('not found'));
  });

  test('POST /api/analyses registers an analysis run', async () => {
    const res = await fetch(`${baseUrl}/api/analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repositoryId: createdRepoId,
        branch: 'main',
        triggeredBy: 'manual_verification',
        status: 'completed',
        summaryMetrics: {
          totalCommits: 3,
          highRiskCommits: 2,
          averageStressIndex: 64.6,
          correlationScore: 0.76,
          detectedBugOrigins: 2,
          mlAccuracy: '87.4% F1-Score',
        },
      }),
    });

    assert.equal(res.status, 201);
    const payload = await res.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.status, 'completed');
    assert.ok(payload.data.id || payload.data._id);

    createdAnalysisId = payload.data.id || payload.data._id;
  });

  test('GET /api/analyses lists analysis runs populated with repository metadata', async () => {
    const res = await fetch(`${baseUrl}/api/analyses`);
    assert.equal(res.status, 200);

    const payload = await res.json();
    assert.equal(payload.success, true);
    assert.ok(Array.isArray(payload.data.items));
    assert.equal(payload.data.items.length, 1);
    assert.equal(payload.data.items[0].status, 'completed');
    assert.ok(payload.data.items[0].repositoryId);
    assert.equal(payload.data.items[0].repositoryId.fullName, 'facebook/react');
  });

  test('GET /api/analyses/:id retrieves saved analysis run details', async () => {
    const res = await fetch(`${baseUrl}/api/analyses/${createdAnalysisId}`);
    assert.equal(res.status, 200);

    const payload = await res.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.status, 'completed');
    assert.equal(payload.data.summaryMetrics.totalCommits, 3);
  });

  test('GET /api/analyses/:id returns 400 for invalid ObjectId format', async () => {
    const res = await fetch(`${baseUrl}/api/analyses/invalid-id-xyz`);
    assert.equal(res.status, 400);

    const payload = await res.json();
    assert.equal(payload.success, false);
    assert.ok(payload.message.includes('must be a valid 24-character hexadecimal ObjectId'));
  });

  test('GET /api/analyses/:id returns 404 for nonexistent valid ObjectId', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/api/analyses/${nonExistentId}`);
    assert.equal(res.status, 404);

    const payload = await res.json();
    assert.equal(payload.success, false);
    assert.ok(payload.message.includes('not found'));
  });
});
