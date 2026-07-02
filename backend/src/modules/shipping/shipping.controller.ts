import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { ShippingService } from './shipping.service';

/**
 * Admin shipping endpoints. Restricted to ADMIN/SUPER_ADMIN.
 */
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Post()
  create(@Body() dto: CreateShipmentDto) {
    return this.shipping.create(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.shipping.getById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShipmentDto) {
    return this.shipping.update(id, dto);
  }
}
