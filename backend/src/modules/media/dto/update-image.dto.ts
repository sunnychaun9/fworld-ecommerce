import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

import { UUID_PATTERN } from './create-image.dto';

/**
 * Partial update for a product image (admin). `productId` is immutable; set
 * `variantId` to `null` to detach the image from a variant.
 */
export class UpdateImageDto {
  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @Matches(UUID_PATTERN, { message: 'variantId must be a valid UUID' })
  variantId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  altText?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
