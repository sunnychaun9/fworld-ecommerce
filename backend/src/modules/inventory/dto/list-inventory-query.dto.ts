import { IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

import { STOCK_STATUSES, StockStatus, UUID_PATTERN } from './create-inventory.dto';

export const INVENTORY_SORTS = ['newest', 'availableStock'] as const;
export type InventorySort = (typeof INVENTORY_SORTS)[number];

/** Query for the inventory list (offset pagination, allow-listed filters + sort). */
export class ListInventoryQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Matches(UUID_PATTERN, { message: 'variantId must be a valid UUID' })
  variantId?: string;

  @IsOptional()
  @IsIn(STOCK_STATUSES)
  stockStatus?: StockStatus;

  @IsOptional()
  @IsIn(INVENTORY_SORTS)
  sort?: InventorySort;
}
