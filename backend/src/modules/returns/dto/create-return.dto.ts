import { IsString, Length, Matches } from 'class-validator';

/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Customer payload to request a return for a delivered order item. */
export class CreateReturnDto {
  @Matches(UUID_PATTERN, { message: 'orderItemId must be a valid UUID' })
  orderItemId!: string;

  @IsString()
  @Length(1, 500)
  reason!: string;
}
