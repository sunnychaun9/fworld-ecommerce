import { IsNumber, IsOptional, IsPositive, IsString, Length, MaxLength } from 'class-validator';

/**
 * Partial update for a variant (admin). Every field is optional; `productId` is
 * immutable (a variant cannot be moved to another product).
 */
export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  @Length(1, 64)
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  barcode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  size?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  colorHex?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  priceOverride?: number;
}
