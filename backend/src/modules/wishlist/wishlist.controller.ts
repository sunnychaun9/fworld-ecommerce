import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { Principal } from '../../auth/principal';
import { AddWishlistDto } from './dto/add-wishlist.dto';
import { WishlistService } from './wishlist.service';

/**
 * Wishlist endpoints. Authenticated only (global AuthGuard); scoped to the user.
 */
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@CurrentUser() user: Principal) {
    return this.wishlist.list(user.userId);
  }

  @Post()
  add(@CurrentUser() user: Principal, @Body() dto: AddWishlistDto) {
    return this.wishlist.add(user.userId, dto);
  }

  @Delete(':productId')
  remove(@CurrentUser() user: Principal, @Param('productId') productId: string) {
    return this.wishlist.remove(user.userId, productId);
  }
}
