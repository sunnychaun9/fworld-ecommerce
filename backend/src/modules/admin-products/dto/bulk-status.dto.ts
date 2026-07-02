import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsIn, Matches } from 'class-validator';

/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const PRODUCT_STATUSES = ['ACTIVE', 'DRAFT', 'ARCHIVED'] as const;
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

/** Bulk product status update. */
export class BulkStatusDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @Matches(UUID_PATTERN, { each: true, message: 'productIds must be valid UUIDs' })
  productIds!: string[];

  @IsIn(PRODUCT_STATUSES)
  status!: ProductStatusValue;
}
