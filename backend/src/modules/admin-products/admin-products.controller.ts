import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminProductsService } from './admin-products.service';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import { BulkFeaturedDto } from './dto/bulk-featured.dto';
import { BulkStatusDto } from './dto/bulk-status.dto';

/**
 * Bulk product operations (ADMIN/SUPER_ADMIN). Each endpoint returns the number
 * of affected products.
 */
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly adminProducts: AdminProductsService) {}

  @Post('status')
  @HttpCode(HttpStatus.OK)
  setStatus(@Body() dto: BulkStatusDto) {
    return this.adminProducts.setStatus(dto);
  }

  @Post('featured')
  @HttpCode(HttpStatus.OK)
  setFeatured(@Body() dto: BulkFeaturedDto) {
    return this.adminProducts.setFeatured(dto);
  }

  @Post('delete')
  @HttpCode(HttpStatus.OK)
  softDelete(@Body() dto: BulkDeleteDto) {
    return this.adminProducts.softDelete(dto);
  }

  @Post('restore')
  @HttpCode(HttpStatus.OK)
  restore(@Body() dto: BulkDeleteDto) {
    return this.adminProducts.restore(dto);
  }
}
