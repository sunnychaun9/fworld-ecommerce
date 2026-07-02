import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  Matches,
} from 'class-validator';

import { UUID_PATTERN } from './bulk-status.dto';

/** Bulk merchandising-flag update (at least one flag required). */
export class BulkFeaturedDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @Matches(UUID_PATTERN, { each: true, message: 'productIds must be valid UUIDs' })
  productIds!: string[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  newArrival?: boolean;

  @IsOptional()
  @IsBoolean()
  bestSeller?: boolean;
}
