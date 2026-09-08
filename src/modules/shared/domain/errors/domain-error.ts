import { HttpStatus } from '@nestjs/common';

export abstract class DomainError extends Error {
  abstract code: string;
  abstract status: HttpStatus;
  metadata?: Record<string, string>;

  constructor(message?: string, metadata?: Record<string, string>) {
    super(message);
    this.metadata = metadata;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
