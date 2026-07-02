import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** Admin-settable order lifecycle states (PENDING is the initial state only). */
export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

/** Payload to transition an order to a new lifecycle status. */
export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES)
  status!: OrderStatusValue;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
