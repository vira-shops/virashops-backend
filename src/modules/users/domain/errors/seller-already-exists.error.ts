import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class SellerAlreadyExistsError extends DomainError {
  code = ErrorCode.SELLER_ALREADY_EXISTS;
  status = HttpStatus.CONFLICT;

  constructor() {
    super('A seller profile already exists for this account');
  }
}
