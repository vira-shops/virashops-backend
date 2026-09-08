import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class UnauthorizedError extends DomainError {
  code = ErrorCode.UNAUTHORIZED;
  status = HttpStatus.UNAUTHORIZED;

  constructor() {
    super('Unauthorized');
  }
}
