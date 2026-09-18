import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class OrderNotFoundError extends DomainError {
  code = ErrorCode.ORDER_NOT_FOUND;
  status = HttpStatus.NOT_FOUND;

  constructor() {
    super('Order not found');
  }
}
