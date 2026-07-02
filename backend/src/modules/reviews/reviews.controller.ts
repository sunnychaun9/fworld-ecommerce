import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import type { Principal } from '../../auth/principal';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

/**
 * Review endpoints. Product reviews are public to read; writing and listing your
 * own reviews require an authenticated session (global AuthGuard).
 */
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Get('product/:productId')
  listByProduct(@Param('productId') productId: string) {
    return this.reviews.listByProduct(productId);
  }

  @Get('my')
  listMine(@CurrentUser() user: Principal) {
    return this.reviews.listMine(user.userId);
  }

  @Post()
  create(@CurrentUser() user: Principal, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.userId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: Principal, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviews.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: Principal, @Param('id') id: string) {
    return this.reviews.remove(user.userId, id);
  }
}
