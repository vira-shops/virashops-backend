import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class CategoryNotFoundError extends DomainError {
  code = ErrorCode.CATEGORY_NOT_FOUND;
  status = HttpStatus.NOT_FOUND;

  constructor() {
    super('Category not found');
  }
}
