import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class SellerNotActiveError extends DomainError {
  code = ErrorCode.SELLER_NOT_ACTIVE;
  status = HttpStatus.FORBIDDEN;

  constructor() {
    super('Seller account is not active');
  }
}
