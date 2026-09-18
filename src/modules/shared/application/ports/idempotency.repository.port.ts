import IdempotencyStatus from '../../domain/model/enums/idempotency-status.enum';

export type IdempotencyRecord = {
  id: number;
  actorType: string;
  actorId: string;
  endpoint: string;
  idempotencyKey: string;
  requestHash: string;
  status: IdempotencyStatus;
  statusCode: number | null;
  responseBody: unknown;
  resourceId: string | null;
  expiresAt: Date;
};

export type ReserveIdempotencyInput = {
  actorType: string;
  actorId: string;
  endpoint: string;
  idempotencyKey: string;
  requestHash: string;
  expiresAt: Date;
};

export default interface IdempotencyRepositoryPort {
  tryInsertProcessing(
    input: ReserveIdempotencyInput,
  ): Promise<IdempotencyRecord | null>;
  findByActorEndpointKey(
    actorType: string,
    actorId: string,
    endpoint: string,
    idempotencyKey: string,
  ): Promise<IdempotencyRecord | null>;
  resetExpiredToProcessing(
    id: number,
    requestHash: string,
    expiresAt: Date,
  ): Promise<IdempotencyRecord | null>;
  reclaimFailedToProcessing(
    id: number,
    requestHash: string,
    expiresAt: Date,
  ): Promise<IdempotencyRecord | null>;
  complete(
    id: number,
    statusCode: number,
    responseBody: unknown,
    resourceId: string | null,
  ): Promise<void>;
  fail(id: number): Promise<void>;
  release(id: number): Promise<void>;
}
