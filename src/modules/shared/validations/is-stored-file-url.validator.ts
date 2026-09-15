import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isStoredFileUrl } from '../utils/stored-file-url.util';

@ValidatorConstraint({ name: 'isStoredFileUrl', async: false })
export class IsStoredFileUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isStoredFileUrl(value);
  }

  defaultMessage(): string {
    return 'URL must point to a file uploaded via /files/upload (path contains /uploads/)';
  }
}

export function IsStoredFileUrl(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStoredFileUrlConstraint,
    });
  };
}
