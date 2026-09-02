import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class InvalidPhoneError extends DomainError {
  code = ErrorCode.INVALID_PHONE;
  status = HttpStatus.BAD_REQUEST;

  constructor() {
    super('Invalid mobile number');
  }
}
