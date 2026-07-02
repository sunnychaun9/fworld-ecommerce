import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import { ORDER_STATUSES, OrderStatusValue } from './update-order-status.dto';

/** Query filters for the admin order list. */
export class ListAdminOrdersDto {
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatusValue;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
