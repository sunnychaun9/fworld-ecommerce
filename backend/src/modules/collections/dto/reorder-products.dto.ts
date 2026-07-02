import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, Matches, Min, ValidateNested } from 'class-validator';

import { UUID_PATTERN } from './create-collection.dto';

export class ReorderItemDto {
  @Matches(UUID_PATTERN, { message: 'productId must be a valid UUID' })
  productId!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

/** Payload to reorder products within a collection (admin). */
export class ReorderProductsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
