import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import { BRAND_STATUSES, BrandStatus } from './create-brand.dto';

/** Query for the brand list (offset pagination — bounded reference set). */
export class ListBrandsQueryDto {
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
  @IsIn(BRAND_STATUSES)
  status?: BrandStatus;
}
