import { IsNumber, IsString, Length, Min } from 'class-validator';

/** Payload to validate a coupon against an order amount (no order created). */
export class ValidateCouponDto {
  @IsString()
  @Length(1, 40)
  code!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  orderAmount!: number;
}
