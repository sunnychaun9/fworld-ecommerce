import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

import {
  CATEGORY_STATUSES,
  CategoryStatus,
  SLUG_PATTERN,
  UUID_PATTERN,
} from './create-category.dto';

/**
 * Partial update for a category (admin). Every field is optional; `parentId`
 * may be set to `null` to promote a category to a root (re-parenting).
 */
export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  @Matches(SLUG_PATTERN, {
    message: 'slug must be lowercase alphanumeric words separated by hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Allow `null` (make root); validate the pattern only when a value is given.
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @Matches(UUID_PATTERN, { message: 'parentId must be a valid UUID' })
  parentId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsIn(CATEGORY_STATUSES)
  status?: CategoryStatus;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  seoDescription?: string;
}
