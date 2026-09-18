import { HttpStatus } from '@nestjs/common';
import { DomainError } from './domain-error';
import ErrorCode from './error-codes';

export default class IdempotencyKeyRequiredError extends DomainError {
  code = ErrorCode.IDEMPOTENCY_KEY_REQUIRED;
  status = HttpStatus.BAD_REQUEST;

  constructor() {
    super('Idempotency-Key header is required');
  }
}
