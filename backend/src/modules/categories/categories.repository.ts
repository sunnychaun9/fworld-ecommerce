import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/** Filters accepted by the category list query (built into a Prisma `where` here). */
export interface CategoryListFilters {
  status?: string;
  parentId?: string | null;
}

/**
 * Category data-access layer. **All Prisma queries for categories live here**;
 * the service holds business logic only.
 */
@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CategoryUncheckedCreateInput) {
    return this.prisma.category.create({ data });
  }

  findById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  async exists(id: string): Promise<boolean> {
    const found = await this.prisma.category.findUnique({ where: { id }, select: { id: true } });
    return found !== null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const found = await this.prisma.category.findUnique({ where: { slug }, select: { id: true } });
    return found !== null;
  }

  /** Parent id of a category (null when root or missing) — used for cycle walks. */
  async getParentId(id: string): Promise<string | null> {
    const row = await this.prisma.category.findUnique({
      where: { id },
      select: { parentId: true },
    });
    return row?.parentId ?? null;
  }

  countChildren(parentId: string): Promise<number> {
    return this.prisma.category.count({ where: { parentId } });
  }

  update(id: string, data: Prisma.CategoryUncheckedUpdateInput) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  listAndCount(filters: CategoryListFilters, skip: number, take: number) {
    const where: Prisma.CategoryWhereInput = {};
    if (filters.status !== undefined) {
      where.status = filters.status;
    }
    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId;
    }
    return this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip,
        take,
      }),
      this.prisma.category.count({ where }),
    ]);
  }
}
