import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const STORE_SORTS = ['newest', 'priceAsc', 'priceDesc', 'name'] as const;
export type StoreSort = (typeof STORE_SORTS)[number];

/** Public storefront product-listing query. Only ACTIVE products are ever returned. */
export class ListStoreProductsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Matches(UUID_PATTERN, { message: 'categoryId must be a valid UUID' })
  categoryId?: string;

  @IsOptional()
  @Matches(UUID_PATTERN, { message: 'brandId must be a valid UUID' })
  brandId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceMin?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceMax?: number;

  @IsOptional()
  @IsIn(['true', 'false'])
  featured?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  newArrival?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  bestSeller?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  inStock?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  fit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  fabric?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sleeveLength?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  pattern?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  neckType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  occasion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  size?: string;

  @IsOptional()
  @IsIn(STORE_SORTS)
  sort?: StoreSort;
}
