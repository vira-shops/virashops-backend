import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class CartNotFoundError extends DomainError {
  code = ErrorCode.CART_NOT_FOUND;
  status = HttpStatus.NOT_FOUND;

  constructor() {
    super('Cart not found');
  }
}
