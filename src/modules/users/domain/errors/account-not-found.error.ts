import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class AccountNotFoundError extends DomainError {
  code = ErrorCode.ACCOUNT_NOT_FOUND;
  status = HttpStatus.NOT_FOUND;

  constructor() {
    super('No account found for this mobile number');
  }
}
