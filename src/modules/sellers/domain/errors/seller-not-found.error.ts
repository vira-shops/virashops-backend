import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class SellerNotFoundError extends DomainError {
  code = ErrorCode.SELLER_NOT_FOUND;
  status = HttpStatus.NOT_FOUND;

  constructor() {
    super('Seller not found');
  }
}
