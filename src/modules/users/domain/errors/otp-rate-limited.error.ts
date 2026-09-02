import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class OtpRateLimitedError extends DomainError {
  code = ErrorCode.OTP_RATE_LIMITED;
  status = HttpStatus.TOO_MANY_REQUESTS;

  constructor() {
    super('Too many verification attempts');
  }
}
