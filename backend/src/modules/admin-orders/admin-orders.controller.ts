import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';

import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminOrdersService } from './admin-orders.service';
import { ListAdminOrdersDto } from './dto/list-admin-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

/**
 * Admin order management endpoints. Restricted to ADMIN/SUPER_ADMIN; customers
 * receive 403 from the global roles guard.
 */
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly adminOrders: AdminOrdersService) {}

  @Get()
  list(@Query() query: ListAdminOrdersDto) {
    return this.adminOrders.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.adminOrders.getById(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.adminOrders.updateStatus(id, dto);
  }
}
