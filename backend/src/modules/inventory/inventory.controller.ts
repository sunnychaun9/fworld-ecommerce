import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { ListInventoryQueryDto } from './dto/list-inventory-query.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryService } from './inventory.service';

/**
 * Inventory endpoints.
 * - Reads are `@Public()` (storefront availability).
 * - Writes require `ADMIN`/`SUPER_ADMIN` (enforced by the global AuthGuard).
 */
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Public()
  @Get()
  list(@Query() query: ListInventoryQueryDto) {
    return this.inventory.list(query);
  }

  @Public()
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.inventory.getById(id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  create(@Body() dto: CreateInventoryDto) {
    return this.inventory.create(dto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInventoryDto) {
    return this.inventory.update(id, dto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventory.remove(id);
  }
}
