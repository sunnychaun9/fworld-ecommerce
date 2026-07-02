import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { Principal } from '../../auth/principal';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { OrdersService } from './orders.service';

/**
 * Order endpoints. Authenticated only (global AuthGuard); every operation is
 * scoped to the current user.
 */
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@CurrentUser() user: Principal, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.userId, dto);
  }

  @Get()
  list(@CurrentUser() user: Principal, @Query() query: ListOrdersDto) {
    return this.orders.list(user.userId, query);
  }

  @Get(':id')
  getById(@CurrentUser() user: Principal, @Param('id') id: string) {
    return this.orders.getById(user.userId, id);
  }
}
