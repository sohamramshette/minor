process.env.NODE_ENV = 'test';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import { createApp } from '../src/server.js';
import { disconnectDatabase } from '../src/config/database.js';

describe('Server & Health API Endpoints (Phase 2)', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
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
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  test('GET / returns project metadata with Phase 2 status', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.project, 'EmotionTrace');
    assert.ok(data.healthEndpoint);
  });

  test('GET /api/health returns 200 and Phase 2 database telemetry', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    const payload = await res.json();
    assert.equal(payload.success, true);
    assert.ok(payload.data);
    assert.equal(payload.data.phase, 'Phase 2 - MongoDB Atlas Integration');
    assert.ok(payload.data.status === 'ok' || payload.data.status === 'degraded');
    assert.ok(typeof payload.data.uptimeSeconds === 'number');
    assert.ok(payload.data.services);
    assert.ok('database' in payload.data.services);
    assert.ok('github' in payload.data.services);
    assert.ok(payload.data.databaseDetails);
    assert.ok(typeof payload.data.databaseDetails.connected === 'boolean');
    assert.ok(payload.data.memoryUsage);
    assert.ok(payload.timestamp);
  });

  test('GET /api/nonexistent-route returns 404 with standard error format', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent-route`);
    assert.equal(res.status, 404);

    const payload = await res.json();
    assert.equal(payload.success, false);
    assert.ok(payload.message.includes('Route not found'));
    assert.ok(payload.timestamp);
  });
});
