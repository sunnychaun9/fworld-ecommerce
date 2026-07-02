import { IsIn, IsOptional, IsString, IsUrl, Length, Matches, MaxLength } from 'class-validator';

import { BRAND_STATUSES, BrandStatus, SLUG_PATTERN } from './create-brand.dto';

/** Partial update for a brand (admin). Every field is optional. */
export class UpdateBrandDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logo?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsIn(BRAND_STATUSES)
  status?: BrandStatus;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  seoDescription?: string;
}
