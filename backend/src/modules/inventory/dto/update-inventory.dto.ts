import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * Partial update for an inventory record (admin). Every field is optional;
 * `variantId` is immutable (inventory is bound to one variant).
 */
export class UpdateInventoryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  availableStock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reservedStock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockAlert?: number;
}
