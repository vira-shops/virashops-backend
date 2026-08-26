import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { DomainError } from '../../../domain/errors/domain-error';

@Injectable()
@Catch(DomainError)
export default class DomainExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const message = this.i18n.translate(`errors.${exception.code}`, {
      args: exception.metadata,
      defaultValue: exception.message || exception.code,
    });

    response.status(exception.status).json({
      status: exception.status,
      errorCode: exception.code,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
