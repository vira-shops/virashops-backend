import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors/domain-error';
import ErrorCode from '../../../shared/domain/errors/error-codes';

export default class NotificationNotFoundError extends DomainError {
  code = ErrorCode.NOTIFICATION_NOT_FOUND;
  status = HttpStatus.NOT_FOUND;

  constructor() {
    super('Notification not found');
  }
}
