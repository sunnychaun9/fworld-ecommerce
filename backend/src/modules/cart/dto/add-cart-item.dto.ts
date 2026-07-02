import { IsInt, Matches, Min } from 'class-validator';

/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Payload to add a variant to the cart. */
export class AddCartItemDto {
  @Matches(UUID_PATTERN, { message: 'variantId must be a valid UUID' })
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
