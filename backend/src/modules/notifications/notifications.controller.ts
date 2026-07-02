import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { Principal } from '../../auth/principal';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';

/**
 * Notification endpoints. Reading/marking is for the authenticated user; creation
 * is ADMIN/SUPER_ADMIN only.
 */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: Principal) {
    return this.notifications.list(user.userId);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: Principal) {
    return this.notifications.markAllRead(user.userId);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: Principal, @Param('id') id: string) {
    return this.notifications.markRead(user.userId, id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notifications.create(dto);
  }
}
