import { HttpStatus } from '@nestjs/common';
import { DomainError } from './domain-error';
import ErrorCode from './error-codes';

export default class IdempotencyInProgressError extends DomainError {
  code = ErrorCode.IDEMPOTENCY_IN_PROGRESS;
  status = HttpStatus.CONFLICT;

  constructor() {
    super('A request with this Idempotency-Key is already in progress');
  }
}
