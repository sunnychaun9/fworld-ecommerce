import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

import { PRODUCT_STATUSES, ProductStatus, SLUG_PATTERN, UUID_PATTERN } from './create-product.dto';

/** Partial update for a product (admin). Every field is optional. */
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @Length(1, 180)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(SLUG_PATTERN, {
    message: 'slug must be lowercase alphanumeric words separated by hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Matches(UUID_PATTERN, { message: 'categoryId must be a valid UUID' })
  categoryId?: string;

  @IsOptional()
  @Matches(UUID_PATTERN, { message: 'brandId must be a valid UUID' })
  brandId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  mrp?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellingPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  fit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  fabric?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  sleeveLength?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  pattern?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  neckType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  occasion?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  newArrival?: boolean;

  @IsOptional()
  @IsBoolean()
  bestSeller?: boolean;

  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  seoDescription?: string;
}
