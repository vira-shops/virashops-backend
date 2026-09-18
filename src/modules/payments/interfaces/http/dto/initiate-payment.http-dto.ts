import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsString, MinLength } from 'class-validator';
import PaymentMethodName from '../../../domain/model/enums/payment-method.enum';

export default class InitiatePaymentHttpDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  checkoutSessionId!: number;

  @ApiProperty({ enum: PaymentMethodName })
  @IsEnum(PaymentMethodName)
  method!: PaymentMethodName;

  @ApiProperty({ example: 'https://app.example/payments/callback' })
  @IsString()
  @MinLength(8)
  callbackUrl!: string;
}
