import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class CheckoutNotPayableError extends DomainError {
  code = ErrorCode.CHECKOUT_NOT_PAYABLE;
  status = HttpStatus.BAD_REQUEST;

  constructor(message = 'Checkout session is not payable') {
    super(message);
  }
}
