import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

import { UUID_PATTERN } from './create-variant.dto';

export const VARIANT_SORTS = ['newest', 'sku'] as const;
export type VariantSort = (typeof VARIANT_SORTS)[number];

/** Query for the variant list (offset pagination, allow-listed filters + sort). */
export class ListVariantsQueryDto {
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
  @Matches(UUID_PATTERN, { message: 'productId must be a valid UUID' })
  productId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  size?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @IsOptional()
  @IsIn(VARIANT_SORTS)
  sort?: VariantSort;
}
