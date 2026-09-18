import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class InvalidChequeFieldError extends DomainError {
  code = ErrorCode.INVALID_CHEQUE_FIELD;
  status = HttpStatus.BAD_REQUEST;

  constructor(message = 'Invalid cheque submission field') {
    super(message);
  }
}
