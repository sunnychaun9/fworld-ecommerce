import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CollectionSort } from './dto/list-collections-query.dto';

/** Allow-listed filters for the collection list. */
export interface CollectionListFilters {
  status?: string;
}

/** A (productId, sortOrder) pair used when reordering collection products. */
export interface ReorderItem {
  productId: string;
  sortOrder: number;
}

/**
 * Collection data-access layer. **All Prisma queries for collections live here**;
 * the service holds business logic only.
 */
@Injectable()
export class CollectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CollectionUncheckedCreateInput) {
    return this.prisma.collection.create({ data });
  }

  findById(id: string) {
    return this.prisma.collection.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.prisma.collection.findUnique({ where: { slug } });
  }

  async exists(id: string): Promise<boolean> {
    const found = await this.prisma.collection.findUnique({ where: { id }, select: { id: true } });
    return found !== null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const found = await this.prisma.collection.findUnique({
      where: { slug },
      select: { id: true },
    });
    return found !== null;
  }

  update(id: string, data: Prisma.CollectionUncheckedUpdateInput) {
    return this.prisma.collection.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    // Cascade removes collection_products rows; products are untouched.
    await this.prisma.collection.delete({ where: { id } });
  }

  listAndCount(filters: CollectionListFilters, sort: CollectionSort, skip: number, take: number) {
    const where: Prisma.CollectionWhereInput = {};
    if (filters.status !== undefined) {
      where.status = filters.status;
    }
    const orderBy: Prisma.CollectionOrderByWithRelationInput[] =
      sort === 'name' ? [{ name: 'asc' }] : [{ createdAt: 'desc' }, { id: 'desc' }];

    return this.prisma.$transaction([
      this.prisma.collection.findMany({ where, orderBy, skip, take }),
      this.prisma.collection.count({ where }),
    ]);
  }

  async productExists(productId: string): Promise<boolean> {
    const found = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    return found !== null;
  }

  async collectionProductExists(collectionId: string, productId: string): Promise<boolean> {
    const found = await this.prisma.collectionProduct.findUnique({
      where: { collectionId_productId: { collectionId, productId } },
      select: { productId: true },
    });
    return found !== null;
  }

  addProducts(collectionId: string, productIds: string[]) {
    return this.prisma.collectionProduct.createMany({
      data: productIds.map((productId) => ({ collectionId, productId, sortOrder: 0 })),
    });
  }

  async removeProduct(collectionId: string, productId: string): Promise<number> {
    const result = await this.prisma.collectionProduct.deleteMany({
      where: { collectionId, productId },
    });
    return result.count;
  }

  listProducts(collectionId: string) {
    return this.prisma.collectionProduct.findMany({
      where: { collectionId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { product: true },
    });
  }

  reorder(collectionId: string, items: ReorderItem[]) {
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.collectionProduct.updateMany({
          where: { collectionId, productId: item.productId },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
  }
}
