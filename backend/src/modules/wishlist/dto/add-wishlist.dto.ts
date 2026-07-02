import { Matches } from 'class-validator';

/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Payload to add a product to the wishlist. */
export class AddWishlistDto {
  @Matches(UUID_PATTERN, { message: 'productId must be a valid UUID' })
  productId!: string;
}
