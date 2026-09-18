import { createHash } from 'crypto';
import { HttpStatus } from '@nestjs/common';
import type IdempotencyRepositoryPort from '../../../application/ports/idempotency.repository.port';
import IdempotencyKeyRequiredError from '../../errors/idempotency-key-required.error';
import IdempotencyInProgressError from '../../errors/idempotency-in-progress.error';
import IdempotencyKeyReusedError from '../../errors/idempotency-key-reused.error';
import IdempotencyStatus from '../../model/enums/idempotency-status.enum';
import IdempotencyService from './idempotency.service';

describe('IdempotencyService', () => {
  const repo: jest.Mocked<IdempotencyRepositoryPort> = {
    tryInsertProcessing: jest.fn(),
    findByActorEndpointKey: jest.fn(),
    resetExpiredToProcessing: jest.fn(),
    reclaimFailedToProcessing: jest.fn(),
    complete: jest.fn(),
    fail: jest.fn(),
    release: jest.fn(),
  };

  const service = new IdempotencyService(repo);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('hashes body stably regardless of key order', () => {
    const a = IdempotencyService.hashBody({ b: 2, a: 1 });
    const b = IdempotencyService.hashBody({ a: 1, b: 2 });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('returns owner when insert succeeds', async () => {
    repo.tryInsertProcessing.mockResolvedValue({
      id: 1,
      actorType: 'user',
      actorId: '1',
      endpoint: 'POST:/payments/initiate',
      idempotencyKey: 'abcdefgh',
      requestHash: 'abc',
      status: IdempotencyStatus.PROCESSING,
      statusCode: null,
      responseBody: null,
      resourceId: null,
      expiresAt: new Date(Date.now() + 1000),
    });

    const outcome = await service.reserve({
      actorType: 'user',
      actorId: '1',
      endpoint: 'POST:/payments/initiate',
      idempotencyKey: 'abcdefgh',
      requestHash: 'abc',
    });

    expect(outcome.kind).toBe('owner');
  });

  it('replays completed response', async () => {
    repo.tryInsertProcessing.mockResolvedValue(null);
    repo.findByActorEndpointKey.mockResolvedValue({
      id: 2,
      actorType: 'user',
      actorId: '1',
      endpoint: 'POST:/payments/initiate',
      idempotencyKey: 'abcdefgh',
      requestHash: 'abc',
      status: IdempotencyStatus.COMPLETED,
      statusCode: HttpStatus.CREATED,
      responseBody: { id: 99 },
      resourceId: '99',
      expiresAt: new Date(Date.now() + 1000),
    });

    const outcome = await service.reserve({
      actorType: 'user',
      actorId: '1',
      endpoint: 'POST:/payments/initiate',
      idempotencyKey: 'abcdefgh',
      requestHash: 'abc',
    });

    expect(outcome).toEqual({
      kind: 'replay',
      statusCode: HttpStatus.CREATED,
      responseBody: { id: 99 },
    });
  });

  it('rejects reused key with different hash', async () => {
    repo.tryInsertProcessing.mockResolvedValue(null);
    repo.findByActorEndpointKey.mockResolvedValue({
      id: 2,
      actorType: 'user',
      actorId: '1',
      endpoint: 'POST:/payments/initiate',
      idempotencyKey: 'abcdefgh',
      requestHash: 'old',
      status: IdempotencyStatus.COMPLETED,
      statusCode: 201,
      responseBody: {},
      resourceId: null,
      expiresAt: new Date(Date.now() + 1000),
    });

    await expect(
      service.reserve({
        actorType: 'user',
        actorId: '1',
        endpoint: 'POST:/payments/initiate',
        idempotencyKey: 'abcdefgh',
        requestHash: 'new',
      }),
    ).rejects.toBeInstanceOf(IdempotencyKeyReusedError);
  });

  it('throws in progress for processing record', async () => {
    repo.tryInsertProcessing.mockResolvedValue(null);
    repo.findByActorEndpointKey.mockResolvedValue({
      id: 2,
      actorType: 'user',
      actorId: '1',
      endpoint: 'POST:/payments/initiate',
      idempotencyKey: 'abcdefgh',
      requestHash: 'abc',
      status: IdempotencyStatus.PROCESSING,
      statusCode: null,
      responseBody: null,
      resourceId: null,
      expiresAt: new Date(Date.now() + 1000),
    });

    await expect(
      service.reserve({
        actorType: 'user',
        actorId: '1',
        endpoint: 'POST:/payments/initiate',
        idempotencyKey: 'abcdefgh',
        requestHash: 'abc',
      }),
    ).rejects.toBeInstanceOf(IdempotencyInProgressError);
  });

  it('releases on validation-like errors', async () => {
    await service.onHandlerError(5, new IdempotencyKeyRequiredError());
    expect(repo.release.mock.calls).toEqual([[5]]);
  });

  it('fails on unexpected errors', async () => {
    await service.onHandlerError(5, new Error('boom'));
    expect(repo.fail.mock.calls).toEqual([[5]]);
  });

  it('uses sha256', () => {
    const expected = createHash('sha256').update('{}').digest('hex');
    expect(IdempotencyService.hashBody({})).toBe(expected);
  });
});
