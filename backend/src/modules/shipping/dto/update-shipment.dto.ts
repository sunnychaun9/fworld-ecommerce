import { IsBoolean, IsISO8601, IsOptional, IsString, Length, MaxLength } from 'class-validator';

/** Partial update for a shipment; `delivered=true` marks the order DELIVERED. */
export class UpdateShipmentDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  courier?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  trackingUrl?: string;

  @IsOptional()
  @IsISO8601()
  estimatedDelivery?: string;

  @IsOptional()
  @IsBoolean()
  delivered?: boolean;
}
