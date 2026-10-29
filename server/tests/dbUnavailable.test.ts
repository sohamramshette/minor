process.env.NODE_ENV = 'test';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import { createApp } from '../src/server.js';
import {
  isDatabaseConnected,
  getDatabaseStatus,
  connectDatabase,
  disconnectDatabase,
} from '../src/config/database.js';

describe('Database Graceful Handling (When Unavailable / Standalone)', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    // Ensure disconnected state
    await disconnectDatabase();

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

  test('isDatabaseConnected() returns false when disconnected', () => {
    assert.equal(isDatabaseConnected(), false);
  });

  test('getDatabaseStatus() does not report connected when offline', () => {
    const status = getDatabaseStatus();
    assert.ok(status === 'unconfigured' || status === 'disconnected');
    assert.notEqual(status, 'connected');
  });

  test('connectDatabase() handles unreachable host gracefully without crashing', async () => {
    // Invalid connection string should return false, not throw uncaught exception
    const result = await connectDatabase('mongodb://127.0.0.1:27099/unreachable_db');
    assert.equal(result, false);
    assert.equal(isDatabaseConnected(), false);
  });

  test('GET /api/repositories returns 503 Service Unavailable when DB is offline', async () => {
    const res = await fetch(`${baseUrl}/api/repositories`);
    assert.equal(res.status, 503);

    const payload = await res.json();
    assert.equal(payload.success, false);
    assert.ok(payload.message.includes('Database service unavailable'));
    assert.ok(payload.error);
    assert.ok(payload.timestamp);
  });

  test('GET /api/analyses returns 503 Service Unavailable when DB is offline', async () => {
    const res = await fetch(`${baseUrl}/api/analyses`);
    assert.equal(res.status, 503);

    const payload = await res.json();
    assert.equal(payload.success, false);
    assert.ok(payload.message.includes('Database service unavailable'));
  });
});
