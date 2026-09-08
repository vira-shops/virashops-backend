import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class ProductNotFoundError extends DomainError {
  code = ErrorCode.PRODUCT_NOT_FOUND;
  status = HttpStatus.NOT_FOUND;

  constructor() {
    super('Product not found');
  }
}
