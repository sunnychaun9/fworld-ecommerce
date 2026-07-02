import { IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

import { PRODUCT_STATUSES, ProductStatus, UUID_PATTERN } from './create-product.dto';

export const PRODUCT_SORTS = ['newest', 'priceAsc', 'priceDesc'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

/** Query for the product list (offset pagination, allow-listed filters + sort). */
export class ListProductsQueryDto {
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
  @IsIn(PRODUCT_STATUSES)
  status?: ProductStatus;

  @IsOptional()
  @Matches(UUID_PATTERN, { message: 'categoryId must be a valid UUID' })
  categoryId?: string;

  @IsOptional()
  @Matches(UUID_PATTERN, { message: 'brandId must be a valid UUID' })
  brandId?: string;

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
  @IsIn(PRODUCT_SORTS)
  sort?: ProductSort;
}
