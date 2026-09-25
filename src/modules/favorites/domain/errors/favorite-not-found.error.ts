import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class FavoriteNotFoundError extends DomainError {
  code = ErrorCode.FAVORITE_NOT_FOUND;
  status = HttpStatus.NOT_FOUND;

  constructor() {
    super('Favorite not found');
  }
}
