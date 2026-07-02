import { IsInt, IsOptional, IsString, IsUrl, Matches, MaxLength, Min } from 'class-validator';

/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Payload to create a product image (admin). URLs only — no uploads. */
export class CreateImageDto {
  @Matches(UUID_PATTERN, { message: 'productId must be a valid UUID' })
  productId!: string;

  @IsUrl()
  url!: string;

  @IsOptional()
  @Matches(UUID_PATTERN, { message: 'variantId must be a valid UUID' })
  variantId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  altText?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
