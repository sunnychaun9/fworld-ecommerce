import { IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';

/** Partial update for a customer address. */
export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 180)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  state?: string;

  @IsOptional()
  @IsString()
  @Length(1, 12)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
