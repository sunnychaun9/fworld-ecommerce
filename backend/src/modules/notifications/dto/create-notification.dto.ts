import { IsIn, IsObject, IsOptional, IsString, Length, Matches } from 'class-validator';

/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const NOTIFICATION_TYPES = [
  'ORDER',
  'PAYMENT',
  'SHIPPING',
  'RETURN',
  'PROMOTION',
  'SYSTEM',
] as const;
export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number];

/** Admin payload to create a notification for a user. */
export class CreateNotificationDto {
  @Matches(UUID_PATTERN, { message: 'userId must be a valid UUID' })
  userId!: string;

  @IsIn(NOTIFICATION_TYPES)
  type!: NotificationTypeValue;

  @IsString()
  @Length(1, 180)
  title!: string;

  @IsString()
  @Length(1, 2000)
  message!: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
