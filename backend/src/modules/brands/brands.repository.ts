import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/** Filters accepted by the brand list query (built into a Prisma `where` here). */
export interface BrandListFilters {
  status?: string;
}

/**
 * Brand data-access layer. **All Prisma queries for brands live here**; the
 * service holds business logic only.
 */
@Injectable()
export class BrandsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.BrandUncheckedCreateInput) {
    return this.prisma.brand.create({ data });
  }

  findById(id: string) {
    return this.prisma.brand.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.prisma.brand.findUnique({ where: { slug } });
  }

  async exists(id: string): Promise<boolean> {
    const found = await this.prisma.brand.findUnique({ where: { id }, select: { id: true } });
    return found !== null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const found = await this.prisma.brand.findUnique({ where: { slug }, select: { id: true } });
    return found !== null;
  }

  /** Number of products referencing this brand (delete-protection check). */
  countProducts(brandId: string): Promise<number> {
    return this.prisma.product.count({ where: { brandId } });
  }

  update(id: string, data: Prisma.BrandUncheckedUpdateInput) {
    return this.prisma.brand.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.brand.delete({ where: { id } });
  }

  listAndCount(filters: BrandListFilters, skip: number, take: number) {
    const where: Prisma.BrandWhereInput = {};
    if (filters.status !== undefined) {
      where.status = filters.status;
    }
    return this.prisma.$transaction([
      this.prisma.brand.findMany({ where, orderBy: [{ name: 'asc' }], skip, take }),
      this.prisma.brand.count({ where }),
    ]);
  }
}
