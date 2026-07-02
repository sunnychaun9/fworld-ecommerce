import { IsInt, IsOptional, Matches, Min } from 'class-validator';

/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Computed (never stored) stock status. */
export const STOCK_STATUSES = ['OUT_OF_STOCK', 'LOW_STOCK', 'IN_STOCK'] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

/** Payload to create an inventory record for a variant (admin). */
export class CreateInventoryDto {
  @Matches(UUID_PATTERN, { message: 'variantId must be a valid UUID' })
  variantId!: string;

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
