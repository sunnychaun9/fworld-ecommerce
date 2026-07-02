import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Pagination for the admin inventory list. */
export class ListInventoryDto {
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
