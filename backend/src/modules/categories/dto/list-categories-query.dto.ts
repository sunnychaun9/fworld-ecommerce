import { IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

import { CATEGORY_STATUSES, CategoryStatus, UUID_PATTERN } from './create-category.dto';

/**
 * Query for the category list. Offset pagination is used deliberately —
 * categories are a small, bounded reference set (api-architecture/03).
 */
export class ListCategoriesQueryDto {
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
  @Matches(UUID_PATTERN, { message: 'parentId must be a valid UUID' })
  parentId?: string;

  /** `true` returns only root categories (no parent). */
  @IsOptional()
  @IsIn(['true', 'false'])
  rootOnly?: string;

  @IsOptional()
  @IsIn(CATEGORY_STATUSES)
  status?: CategoryStatus;
}
