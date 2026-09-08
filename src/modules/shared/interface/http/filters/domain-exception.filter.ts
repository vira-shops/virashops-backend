import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import ApiResponse from '../../../../../common/http/api-response';
import { DomainError } from '../../../domain/errors/domain-error';
import ErrorCode from '../../../domain/errors/error-codes';

@Catch()
@Injectable()
export default class DomainExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof DomainError) {
      const message = this.translate(
        exception.code,
        exception.message,
        exception.metadata,
      );
      response.status(exception.status).json(
        ApiResponse.error(exception.status, {
          errorCode: exception.code,
          message,
        }),
      );
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const details = this.httpDetails(payload);
      const errorCode = this.errorCodeForStatus(status);
      const message = this.translate(
        errorCode,
        this.httpMessage(payload, exception.message),
      );
      response.status(status).json(
        ApiResponse.error(status, {
          errorCode,
          message,
          ...(details ? { details } : {}),
        }),
      );
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR, {
        errorCode: ErrorCode.INTERNAL,
        message: this.translate(
          ErrorCode.INTERNAL,
          'An unexpected error occurred',
        ),
      }),
    );
  }

  private translate(
    code: string,
    fallback: string,
    args?: Record<string, string>,
  ): string {
    const translated = this.i18n.translate(`errors.${code}`, {
      args,
      defaultValue: fallback || code,
    });
    return typeof translated === 'string' ? translated : fallback;
  }

  private errorCodeForStatus(status: number): string {
    const byStatus: Record<number, ErrorCode> = {
      [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION,
      [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
      [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
      [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
    };
    return byStatus[status] ?? ErrorCode.INTERNAL;
  }

  private httpMessage(payload: string | object, fallback: string): string {
    if (typeof payload === 'string') {
      return payload;
    }
    const message = (payload as { message?: string | string[] }).message;
    if (Array.isArray(message)) {
      return message[0] ?? fallback;
    }
    if (typeof message === 'string') {
      return message;
    }
    return fallback;
  }

  private httpDetails(payload: string | object): unknown {
    if (typeof payload !== 'object' || payload === null) {
      return undefined;
    }
    const message = (payload as { message?: string | string[] }).message;
    return Array.isArray(message) ? message : undefined;
  }
}
