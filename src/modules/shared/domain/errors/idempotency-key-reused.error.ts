import { HttpStatus } from '@nestjs/common';
import { DomainError } from './domain-error';
import ErrorCode from './error-codes';

export default class IdempotencyKeyReusedError extends DomainError {
  code = ErrorCode.IDEMPOTENCY_KEY_REUSED;
  status = HttpStatus.CONFLICT;

  constructor() {
    super('Idempotency-Key was already used with a different request body');
  }
}
