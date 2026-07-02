import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { ProductSort } from './dto/list-products-query.dto';

/** Allow-listed filters for the product list (built into a Prisma `where` here). */
export interface ProductListFilters {
  status?: string;
  categoryId?: string;
  brandId?: string;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
}

/**
 * Product data-access layer. **All Prisma queries for products live here**; the
 * service holds business logic only.
 */
@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ProductUncheckedCreateInput) {
    return this.prisma.product.create({ data });
  }

  findById(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.prisma.product.findUnique({ where: { slug } });
  }

  async slugExists(slug: string): Promise<boolean> {
    const found = await this.prisma.product.findUnique({ where: { slug }, select: { id: true } });
    return found !== null;
  }

  async categoryExists(id: string): Promise<boolean> {
    const found = await this.prisma.category.findUnique({ where: { id }, select: { id: true } });
    return found !== null;
  }

  async brandExists(id: string): Promise<boolean> {
    const found = await this.prisma.brand.findUnique({ where: { id }, select: { id: true } });
    return found !== null;
  }

  update(id: string, data: Prisma.ProductUncheckedUpdateInput) {
    return this.prisma.product.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  listAndCount(filters: ProductListFilters, sort: ProductSort, skip: number, take: number) {
    const where: Prisma.ProductWhereInput = {};
    if (filters.status !== undefined) {
      where.status = filters.status;
    }
    if (filters.categoryId !== undefined) {
      where.categoryId = filters.categoryId;
    }
    if (filters.brandId !== undefined) {
      where.brandId = filters.brandId;
    }
    if (filters.featured !== undefined) {
      where.featured = filters.featured;
    }
    if (filters.newArrival !== undefined) {
      where.newArrival = filters.newArrival;
    }
    if (filters.bestSeller !== undefined) {
      where.bestSeller = filters.bestSeller;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sort === 'priceAsc'
        ? [{ sellingPrice: 'asc' }, { id: 'asc' }]
        : sort === 'priceDesc'
          ? [{ sellingPrice: 'desc' }, { id: 'asc' }]
          : [{ createdAt: 'desc' }, { id: 'desc' }];

    return this.prisma.$transaction([
      this.prisma.product.findMany({ where, orderBy, skip, take }),
      this.prisma.product.count({ where }),
    ]);
  }
}
