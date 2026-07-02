import { IsISO8601, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Payload to create a shipment for a confirmed order. */
export class CreateShipmentDto {
  @Matches(UUID_PATTERN, { message: 'orderId must be a valid UUID' })
  orderId!: string;

  @IsString()
  @Length(1, 120)
  courier!: string;

  @IsString()
  @Length(1, 120)
  trackingNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  trackingUrl?: string;

  @IsOptional()
  @IsISO8601()
  estimatedDelivery?: string;
}
