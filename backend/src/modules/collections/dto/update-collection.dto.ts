import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

import { COLLECTION_STATUSES, CollectionStatus, SLUG_PATTERN } from './create-collection.dto';

/** Partial update for a collection (admin). */
export class UpdateCollectionDto {
  @IsOptional()
  @IsString()
  @Length(1, 140)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Matches(SLUG_PATTERN, {
    message: 'slug must be lowercase alphanumeric words separated by hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  image?: string;

  @IsOptional()
  @IsIn(COLLECTION_STATUSES)
  status?: CollectionStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  seoDescription?: string;
}
