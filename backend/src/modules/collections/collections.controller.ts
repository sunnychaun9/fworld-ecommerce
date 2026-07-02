import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CollectionsService } from './collections.service';
import { AddProductsDto } from './dto/add-products.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { ListCollectionsQueryDto } from './dto/list-collections-query.dto';
import { ReorderProductsDto } from './dto/reorder-products.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

/**
 * Collection endpoints.
 * - Reads are `@Public()` (storefront merchandising).
 * - Writes require `ADMIN`/`SUPER_ADMIN` (enforced by the global AuthGuard).
 */
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Public()
  @Get()
  list(@Query() query: ListCollectionsQueryDto) {
    return this.collections.list(query);
  }

  @Public()
  @Get('slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.collections.getBySlug(slug);
  }

  @Public()
  @Get(':id/products')
  listProducts(@Param('id') id: string) {
    return this.collections.listProducts(id);
  }

  @Public()
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.collections.getById(id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  create(@Body() dto: CreateCollectionDto) {
    return this.collections.create(dto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id/products/reorder')
  reorder(@Param('id') id: string, @Body() dto: ReorderProductsDto) {
    return this.collections.reorderProducts(id, dto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.collections.update(id, dto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id/products/:productId')
  removeProduct(@Param('id') id: string, @Param('productId') productId: string) {
    return this.collections.removeProduct(id, productId);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collections.remove(id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post(':id/products')
  addProducts(@Param('id') id: string, @Body() dto: AddProductsDto) {
    return this.collections.addProducts(id, dto);
  }
}
