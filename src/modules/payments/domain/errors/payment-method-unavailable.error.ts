import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class PaymentMethodUnavailableError extends DomainError {
  code = ErrorCode.PAYMENT_METHOD_UNAVAILABLE;
  status = HttpStatus.BAD_REQUEST;

  constructor() {
    super('Payment method is not available');
  }
}
