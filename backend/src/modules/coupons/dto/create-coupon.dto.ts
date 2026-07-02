import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export const COUPON_TYPES = ['PERCENTAGE', 'FLAT'] as const;
export type CouponTypeValue = (typeof COUPON_TYPES)[number];

/** Payload to create a coupon (admin). */
export class CreateCouponDto {
  @IsString()
  @Length(1, 40)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsIn(COUPON_TYPES)
  discountType!: CouponTypeValue;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  discountValue!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  maxDiscount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @IsOptional()
  @IsISO8601()
  validTo?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
