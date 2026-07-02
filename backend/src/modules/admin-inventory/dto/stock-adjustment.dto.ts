import { IsIn, IsInt, IsString, Length, Matches, Min } from 'class-validator';

/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ADJUSTMENT_TYPES = ['INCREASE', 'DECREASE'] as const;
export type AdjustmentType = (typeof ADJUSTMENT_TYPES)[number];

/** Stock adjustment for a variant's available quantity. */
export class StockAdjustmentDto {
  @Matches(UUID_PATTERN, { message: 'variantId must be a valid UUID' })
  variantId!: string;

  @IsIn(ADJUSTMENT_TYPES)
  type!: AdjustmentType;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  @Length(1, 255)
  reason!: string;
}
