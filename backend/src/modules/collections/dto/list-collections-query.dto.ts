import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import { COLLECTION_STATUSES, CollectionStatus } from './create-collection.dto';

export const COLLECTION_SORTS = ['newest', 'name'] as const;
export type CollectionSort = (typeof COLLECTION_SORTS)[number];

/** Query for the collection list (offset pagination, allow-listed filters + sort). */
export class ListCollectionsQueryDto {
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
  @IsIn(COLLECTION_STATUSES)
  status?: CollectionStatus;

  @IsOptional()
  @IsIn(COLLECTION_SORTS)
  sort?: CollectionSort;
}
