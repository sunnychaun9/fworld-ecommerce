import { ArrayNotEmpty, IsArray, Matches } from 'class-validator';

import { UUID_PATTERN } from './create-collection.dto';

/** Payload to add products to a collection (admin). The array cannot be empty. */
export class AddProductsDto {
  @IsArray()
  @ArrayNotEmpty()
  @Matches(UUID_PATTERN, { each: true, message: 'each productId must be a valid UUID' })
  productIds!: string[];
}
