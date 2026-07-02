import { IsString, Length, Matches, MaxLength } from 'class-validator';

import { UUID_PATTERN } from './create-payment.dto';

/** Payload posted back by the client after Razorpay checkout completes. */
export class VerifyPaymentDto {
  @Matches(UUID_PATTERN, { message: 'paymentId must be a valid UUID' })
  paymentId!: string;

  @IsString()
  @Length(1, 255)
  razorpayOrderId!: string;

  @IsString()
  @Length(1, 255)
  razorpayPaymentId!: string;

  @IsString()
  @MaxLength(512)
  razorpaySignature!: string;
}
