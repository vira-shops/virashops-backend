import { HttpStatus } from '@nestjs/common';

export default class ApiResponse {
  static of<T>(data: T, status: HttpStatus = HttpStatus.OK) {
    return { status, data };
  }

  static created<T>(data: T) {
    return ApiResponse.of(data, HttpStatus.CREATED);
  }
}
