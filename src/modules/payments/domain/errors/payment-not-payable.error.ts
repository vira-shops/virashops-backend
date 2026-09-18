import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class PaymentNotPayableError extends DomainError {
  code = ErrorCode.PAYMENT_NOT_PAYABLE;
  status = HttpStatus.BAD_REQUEST;

  constructor(message = 'Payment cannot be completed') {
    super(message);
  }
}
