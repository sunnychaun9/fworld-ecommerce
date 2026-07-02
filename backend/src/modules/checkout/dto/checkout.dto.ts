import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

/** Checkout preparation input. Coupon handling is added in a later milestone. */
export class CheckoutDto {
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(64)
  couponCode?: string | null;
}
