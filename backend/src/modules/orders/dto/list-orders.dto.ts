import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Query for the authenticated user's order list (offset pagination). */
export class ListOrdersDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
