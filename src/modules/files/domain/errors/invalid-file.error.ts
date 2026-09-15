import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class InvalidFileError extends DomainError {
  code = ErrorCode.INVALID_FILE;
  status = HttpStatus.BAD_REQUEST;

  constructor(message = 'Invalid or unsupported file') {
    super(message);
  }
}
