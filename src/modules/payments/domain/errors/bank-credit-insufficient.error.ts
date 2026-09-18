import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class BankCreditInsufficientError extends DomainError {
  code = ErrorCode.BANK_CREDIT_INSUFFICIENT;
  status = HttpStatus.BAD_REQUEST;

  constructor(
    message = 'Cheque credit ceiling is insufficient for this payment',
  ) {
    super(message);
  }
}
