/**
 * Unit tests for the support service.
 *
 * The service is constructed with fake dependencies so these tests:
 *   - Run with no database.
 *   - Verify only the business logic in isolation.
 *   - Stay fast (no I/O).
 */

import { describe, it, expect } from 'vitest';
import { createSupportService } from '../../modules/support/support.service';
import { NotFoundError } from '../../utils/errors';
import type { ResolutionStatus } from '../../validations/support.schema';

function makeFakeRepo() {
  const store = new Map<
    string,
    {
      id: string;
      userMessage: string;
      botResponse: string;
      resolutionStatus: ResolutionStatus;
      createdAt: Date;
    }
  >();

  return {
    store,
    async create(input: { userMessage: string; botResponse: string }) {
      const row = {
        id: `id-${store.size + 1}`,
        userMessage: input.userMessage,
        botResponse: input.botResponse,
        resolutionStatus: 'PENDING' as ResolutionStatus,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };
      store.set(row.id, row);
      return row;
    },
    async findById(id: string) {
      return store.get(id) ?? null;
    },
    async updateStatus(input: { id: string; status: ResolutionStatus }) {
      const row = store.get(input.id);
      if (!row) return null;
      row.resolutionStatus = input.status;
      return row;
    },
  };
}

const fakeBot = {
  async reply(_msg: string) {
    return { text: 'fake bot reply', model: 'fake', latencyMs: 1 };
  },
};

describe('supportService', () => {
  it('handleChat: creates a session and returns the bot response', async () => {
    const repo = makeFakeRepo();
    const service = createSupportService({ repository: repo, chatBot: fakeBot });

    const result = await service.handleChat('Hi there');

    expect(result.botResponse).toBe('fake bot reply');
    expect(result.session.userMessage).toBe('Hi there');
    expect(result.session.botResponse).toBe('fake bot reply');
    expect(result.session.resolutionStatus).toBe('PENDING');
    expect(repo.store.size).toBe(1);
  });

  it('updateResolutionStatus: updates an existing session', async () => {
    const repo = makeFakeRepo();
    const service = createSupportService({ repository: repo, chatBot: fakeBot });

    const created = await service.handleChat('hello');
    const updated = await service.updateResolutionStatus(
      created.session.id,
      'RESOLVED',
    );

    expect(updated.resolutionStatus).toBe('RESOLVED');
  });

  it('updateResolutionStatus: throws NotFoundError for unknown id', async () => {
    const repo = makeFakeRepo();
    const service = createSupportService({ repository: repo, chatBot: fakeBot });

    await expect(
      service.updateResolutionStatus('does-not-exist', 'RESOLVED'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
