import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class ForbiddenError extends DomainError {
  code = ErrorCode.FORBIDDEN;
  status = HttpStatus.FORBIDDEN;

  constructor() {
    super('Forbidden');
  }
}
