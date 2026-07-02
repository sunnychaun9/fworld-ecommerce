import { IsInt, Min } from 'class-validator';

/** Payload to update a cart item quantity. Quantity 0 removes the item. */
export class UpdateCartItemDto {
  @IsInt()
  @Min(0)
  quantity!: number;
}
