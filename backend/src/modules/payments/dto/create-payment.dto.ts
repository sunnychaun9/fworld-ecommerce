import { Matches } from 'class-validator';

/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Payload to create a payment order for an existing order. */
export class CreatePaymentDto {
  @Matches(UUID_PATTERN, { message: 'orderId must be a valid UUID' })
  orderId!: string;
}
