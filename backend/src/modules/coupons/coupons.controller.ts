import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

/**
 * Coupon endpoints.
 * - Admin writes require `ADMIN`/`SUPER_ADMIN`.
 * - `validate` is public; `my` requires an authenticated session.
 */
@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Public()
  @Post('validate')
  validate(@Body() dto: ValidateCouponDto) {
    return this.coupons.validate(dto);
  }

  @Get('my')
  listMine() {
    return this.coupons.listMine();
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.coupons.create(dto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.coupons.update(id, dto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coupons.remove(id);
  }
}
