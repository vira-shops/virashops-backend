import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class ChequeNotReviewableError extends DomainError {
  code = ErrorCode.CHEQUE_NOT_REVIEWABLE;
  status = HttpStatus.BAD_REQUEST;

  constructor(
    message = 'Cheque submission cannot be reviewed in its current state',
  ) {
    super(message);
  }
}
