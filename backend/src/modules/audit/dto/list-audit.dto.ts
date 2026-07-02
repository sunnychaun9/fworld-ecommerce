import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Filters for the admin audit-log listing. */
export class ListAuditDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  action?: string;

  @IsOptional()
  @Matches(UUID_PATTERN, { message: 'actorId must be a valid UUID' })
  actorId?: string;

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
