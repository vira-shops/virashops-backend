import { HttpStatus } from '@nestjs/common';

export type ApiErrorData = {
  errorCode: string;
  message: string;
  details?: unknown;
};

export default class ApiResponse {
  static of<T>(data: T, status: HttpStatus = HttpStatus.OK) {
    return { status, data };
  }

  static created<T>(data: T) {
    return ApiResponse.of(data, HttpStatus.CREATED);
  }

  static error(status: HttpStatus, data: ApiErrorData) {
    return { status, data };
  }
}
