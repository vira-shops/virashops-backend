import { HttpStatus } from '@nestjs/common';
import ApiResponse from './api-response';

describe('ApiResponse', () => {
  it('wraps success with status 200 and data', () => {
    expect(ApiResponse.of({ otpSent: true })).toEqual({
      status: HttpStatus.OK,
      data: { otpSent: true },
    });
  });

  it('wraps errors with the HTTP status and data', () => {
    expect(
      ApiResponse.error(HttpStatus.UNAUTHORIZED, {
        errorCode: 'INVALID_OTP',
        message: 'Invalid verification code',
      }),
    ).toEqual({
      status: 401,
      data: {
        errorCode: 'INVALID_OTP',
        message: 'Invalid verification code',
      },
    });
  });
});
