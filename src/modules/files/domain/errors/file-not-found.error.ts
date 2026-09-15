import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class FileNotFoundError extends DomainError {
  code = ErrorCode.FILE_NOT_FOUND;
  status = HttpStatus.NOT_FOUND;

  constructor(message = 'File not found') {
    super(message);
  }
}
