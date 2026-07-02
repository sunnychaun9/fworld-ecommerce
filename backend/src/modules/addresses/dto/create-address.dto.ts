import { IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';

/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Payload to create a customer address. */
export class CreateAddressDto {
  @IsString()
  @Length(1, 120)
  fullName!: string;

  @IsString()
  @Length(1, 20)
  phone!: string;

  @IsString()
  @Length(1, 180)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  addressLine2?: string;

  @IsString()
  @Length(1, 80)
  city!: string;

  @IsString()
  @Length(1, 80)
  state!: string;

  @IsString()
  @Length(1, 12)
  postalCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
