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

/** Lowercase, hyphen-separated slug (SEO URL segment). */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const COLLECTION_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;
export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];

/** Payload to create a collection (admin). */
export class CreateCollectionDto {
  @IsString()
  @Length(1, 140)
  name!: string;

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
