import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class InvalidOrderStatusTransitionError extends DomainError {
  code = ErrorCode.INVALID_ORDER_STATUS_TRANSITION;
  status = HttpStatus.BAD_REQUEST;

  constructor() {
    super('Invalid order status transition');
  }
}
