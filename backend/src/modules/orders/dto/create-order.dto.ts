import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, Length, MaxLength, ValidateNested } from 'class-validator';

/** Shipping address captured as an immutable JSON snapshot on the order. */
export class ShippingAddressDto {
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
}

/** Payload to create an order from the current user's cart. */
export class CreateOrderDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;
}
