import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class OtpExpiredError extends DomainError {
  code = ErrorCode.OTP_EXPIRED;
  status = HttpStatus.UNAUTHORIZED;

  constructor() {
    super('Verification code has expired');
  }
}
