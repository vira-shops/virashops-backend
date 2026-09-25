import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class InvalidProductRatingError extends DomainError {
  code = ErrorCode.INVALID_PRODUCT_RATING;
  status = HttpStatus.BAD_REQUEST;

  constructor(message = 'Rating must be an integer from 1 to 5') {
    super(message);
  }
}
