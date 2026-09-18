import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class CheckoutSessionNotFoundError extends DomainError {
  code = ErrorCode.CHECKOUT_SESSION_NOT_FOUND;
  status = HttpStatus.NOT_FOUND;

  constructor() {
    super('Checkout session not found');
  }
}
