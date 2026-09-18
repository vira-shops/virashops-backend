import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class BankValidationRequiredError extends DomainError {
  code = ErrorCode.BANK_VALIDATION_REQUIRED;
  status = HttpStatus.BAD_REQUEST;

  constructor(
    message = 'Bank account validation is required before cheque payment',
  ) {
    super(message);
  }
}
