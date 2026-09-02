import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class AccountInactiveError extends DomainError {
  code = ErrorCode.ACCOUNT_INACTIVE;
  status = HttpStatus.FORBIDDEN;

  constructor() {
    super('This account is not active');
  }
}
