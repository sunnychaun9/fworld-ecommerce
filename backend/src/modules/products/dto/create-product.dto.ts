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

/** Lowercase, hyphen-separated slug (SEO URL segment). */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** Payload to create a product (admin). */
export class CreateProductDto {
  @IsString()
  @Length(1, 180)
  name!: string;

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

  @Matches(UUID_PATTERN, { message: 'categoryId must be a valid UUID' })
  categoryId!: string;

  @IsOptional()
  @Matches(UUID_PATTERN, { message: 'brandId must be a valid UUID' })
  brandId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  mrp!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellingPrice!: number;

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
