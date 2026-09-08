import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class SellerDocumentRequiredError extends DomainError {
  code = ErrorCode.VALIDATION;
  status = HttpStatus.BAD_REQUEST;

  constructor() {
    super('National ID or business license is required');
  }
}
