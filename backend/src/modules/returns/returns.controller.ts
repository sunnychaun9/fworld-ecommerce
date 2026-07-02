import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { Principal } from '../../auth/principal';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { ReturnsService } from './returns.service';

/**
 * Returns endpoints. Customers create and view their own returns; admins advance
 * the lifecycle. Return decisions are audit-logged by the global interceptor.
 */
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returns: ReturnsService) {}

  @Post()
  create(@CurrentUser() user: Principal, @Body() dto: CreateReturnDto) {
    return this.returns.create(user.userId, dto);
  }

  @Get()
  list(@CurrentUser() user: Principal) {
    return this.returns.list(user.userId);
  }

  @Get(':id')
  getById(@CurrentUser() user: Principal, @Param('id') id: string) {
    return this.returns.getById(user.userId, id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  adminUpdate(@Param('id') id: string, @Body() dto: UpdateReturnDto) {
    return this.returns.adminUpdate(id, dto);
  }
}
