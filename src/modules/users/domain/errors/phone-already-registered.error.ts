import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class PhoneAlreadyRegisteredError extends DomainError {
  code = ErrorCode.PHONE_ALREADY_REGISTERED;
  status = HttpStatus.CONFLICT;

  constructor() {
    super('This mobile number is already registered');
  }
}
