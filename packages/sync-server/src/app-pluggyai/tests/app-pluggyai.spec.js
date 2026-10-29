import { createServer } from 'node:net';

import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handlers as app } from '#app-pluggyai/app-pluggyai';
import { SecretName, secretsService } from '#services/secrets-service';

// A local port nobody listens on: the connection fails at once, without DNS or
// network, like a bank sync while the internet is down.
async function closedPortUrl() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  await new Promise(resolve => server.close(resolve));
  return `http://127.0.0.1:${port}`;
}

const post = (path, body) =>
  request(app).post(path).set('x-actual-token', 'valid-token').send(body);

describe('app-pluggyai without network', () => {
  const unexpectedErrors = [];
  const recordUnexpected = error => unexpectedErrors.push(error);

  beforeEach(async () => {
    vi.stubEnv('PLUGGY_API_URL', await closedPortUrl());
    secretsService.set(SecretName.pluggyai_clientId, 'client-id');
    secretsService.set(SecretName.pluggyai_clientSecret, 'client-secret');
    secretsService.set(SecretName.pluggyai_itemIds, 'item-1');
    vi.spyOn(console, 'error').mockImplementation(vi.fn());
    unexpectedErrors.length = 0;
    process.on('uncaughtException', recordUnexpected);
    process.on('unhandledRejection', recordUnexpected);
  });

  afterEach(() => {
    process.off('uncaughtException', recordUnexpected);
    process.off('unhandledRejection', recordUnexpected);
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns the failure as a sync error and keeps serving', async () => {
    const accounts = await post('/accounts');
    const transactions = await post('/transactions', {
      accountId: 'account-1',
      startDate: '2026-07-31',
    });

    expect(accounts.body).toEqual({
      status: 'ok',
      data: { error: expect.any(String) },
    });
    expect(transactions.body).toEqual({
      status: 'ok',
      data: { error: expect.any(String) },
    });

    // got retries a network error after about 1 s and again after 2 s. On
    // Node 24.22 the retry of a request that had already failed crashed the
    // process from here.
    await new Promise(resolve => setTimeout(resolve, 3500));
    expect(unexpectedErrors).toEqual([]);
    expect((await post('/status')).body.data.configured).toBe(true);
  }, 15_000);
});
