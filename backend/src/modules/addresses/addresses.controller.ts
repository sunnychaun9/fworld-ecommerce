import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { Principal } from '../../auth/principal';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

/**
 * Customer address endpoints. Authenticated only (global AuthGuard); every
 * operation is scoped to the current user.
 */
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@CurrentUser() user: Principal) {
    return this.addresses.list(user.userId);
  }

  @Get(':id')
  getById(@CurrentUser() user: Principal, @Param('id') id: string) {
    return this.addresses.getById(user.userId, id);
  }

  @Post()
  create(@CurrentUser() user: Principal, @Body() dto: CreateAddressDto) {
    return this.addresses.create(user.userId, dto);
  }

  @Patch(':id/default')
  setDefault(@CurrentUser() user: Principal, @Param('id') id: string) {
    return this.addresses.setDefault(user.userId, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: Principal, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addresses.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: Principal, @Param('id') id: string) {
    return this.addresses.remove(user.userId, id);
  }
}
