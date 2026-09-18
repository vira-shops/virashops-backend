import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class InvalidBankAccountFieldError extends DomainError {
  code = ErrorCode.INVALID_BANK_ACCOUNT_FIELD;
  status = HttpStatus.BAD_REQUEST;

  constructor(message = 'Invalid bank account validation field') {
    super(message);
  }
}
