import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { Principal } from '../../auth/principal';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

/**
 * Authenticated shopping-cart endpoints. No `@Public()` routes — the global
 * AuthGuard requires a session; the cart is always scoped to the current user.
 */
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  getCart(@CurrentUser() user: Principal) {
    return this.cart.getCart(user.userId);
  }

  @Post('items')
  addItem(@CurrentUser() user: Principal, @Body() dto: AddCartItemDto) {
    return this.cart.addItem(user.userId, dto);
  }

  @Patch('items/:id')
  updateItem(
    @CurrentUser() user: Principal,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(user.userId, id, dto);
  }

  @Delete('items/:id')
  removeItem(@CurrentUser() user: Principal, @Param('id') id: string) {
    return this.cart.removeItem(user.userId, id);
  }

  @Delete()
  clearCart(@CurrentUser() user: Principal) {
    return this.cart.clearCart(user.userId);
  }
}
