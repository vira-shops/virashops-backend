import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class CartEmptyError extends DomainError {
  code = ErrorCode.CART_EMPTY;
  status = HttpStatus.BAD_REQUEST;

  constructor() {
    super('Cart is empty');
  }
}
