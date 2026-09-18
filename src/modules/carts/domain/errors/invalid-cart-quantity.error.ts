import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class InvalidCartQuantityError extends DomainError {
  code = ErrorCode.INVALID_CART_QUANTITY;
  status = HttpStatus.BAD_REQUEST;
}
