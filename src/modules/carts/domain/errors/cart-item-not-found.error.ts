import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class CartItemNotFoundError extends DomainError {
  code = ErrorCode.CART_ITEM_NOT_FOUND;
  status = HttpStatus.NOT_FOUND;

  constructor() {
    super('Cart item not found');
  }
}
