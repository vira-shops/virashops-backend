import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class InvalidSellerStatusTransitionError extends DomainError {
  code = ErrorCode.VALIDATION;
  status = HttpStatus.BAD_REQUEST;

  constructor() {
    super('Invalid seller status transition');
  }
}
