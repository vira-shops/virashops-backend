import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class ShippingMethodUnavailableError extends DomainError {
  code = ErrorCode.SHIPPING_METHOD_UNAVAILABLE;
  status = HttpStatus.BAD_REQUEST;

  constructor() {
    super('Shipping method is not available');
  }
}
