import { ArrayMaxSize, ArrayNotEmpty, IsArray, Matches } from 'class-validator';

import { UUID_PATTERN } from './bulk-status.dto';

/** Bulk soft-delete / restore payload. */
export class BulkDeleteDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @Matches(UUID_PATTERN, { each: true, message: 'productIds must be valid UUIDs' })
  productIds!: string[];
}
