import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class SellerProfileIncompleteError extends DomainError {
  code = ErrorCode.SELLER_PROFILE_INCOMPLETE;
  status = HttpStatus.BAD_REQUEST;

  constructor() {
    super('Seller shop profile must be completed before activation');
  }
}
