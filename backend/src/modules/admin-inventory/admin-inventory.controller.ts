import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { Principal } from '../../auth/principal';
import { AdminInventoryService } from './admin-inventory.service';
import { ListInventoryDto } from './dto/list-inventory.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';

/**
 * Admin inventory endpoints (ADMIN/SUPER_ADMIN).
 */
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/inventory')
export class AdminInventoryController {
  constructor(private readonly adminInventory: AdminInventoryService) {}

  @Get()
  list(@Query() query: ListInventoryDto) {
    return this.adminInventory.list(query);
  }

  @Get('low-stock')
  lowStock() {
    return this.adminInventory.lowStock();
  }

  @Post('adjust')
  @HttpCode(HttpStatus.OK)
  adjust(@CurrentUser() user: Principal, @Body() dto: StockAdjustmentDto) {
    return this.adminInventory.adjust(dto, user.userId);
  }
}
