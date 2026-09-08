import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';
import ApiResponse from '../../../../../common/http/api-response';

@Injectable()
export default class ApiEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((body: unknown) => {
        if (this.isEnvelope(body)) {
          response.status(body.status);
          return body;
        }

        const status = response.statusCode || 200;
        const envelope = ApiResponse.of(body ?? null, status);
        response.status(status);
        return envelope;
      }),
    );
  }

  private isEnvelope(body: unknown): body is { status: number; data: unknown } {
    return (
      typeof body === 'object' &&
      body !== null &&
      typeof (body as { status?: unknown }).status === 'number' &&
      'data' in body
    );
  }
}
