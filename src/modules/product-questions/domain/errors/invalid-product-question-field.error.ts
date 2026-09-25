import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class InvalidProductQuestionFieldError extends DomainError {
  code = ErrorCode.VALIDATION;
  status = HttpStatus.BAD_REQUEST;

  constructor(message = 'Invalid product question field') {
    super(message);
  }
}
