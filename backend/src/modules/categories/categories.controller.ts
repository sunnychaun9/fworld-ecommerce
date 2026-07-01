import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * Category endpoints.
 * - Reads are `@Public()` (storefront browsing).
 * - Writes require `ADMIN`/`SUPER_ADMIN` (enforced by the global AuthGuard).
 */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Get()
  list(@Query() query: ListCategoriesQueryDto) {
    return this.categories.list(query);
  }

  @Public()
  @Get('slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.categories.getBySlug(slug);
  }

  @Public()
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.categories.getById(id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categories.remove(id);
  }
}
