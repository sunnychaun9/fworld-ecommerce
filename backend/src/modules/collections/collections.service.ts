import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { CollectionListFilters, CollectionsRepository } from './collections.repository';
import { AddProductsDto } from './dto/add-products.dto';
import { CreateCollectionDto, UUID_PATTERN } from './dto/create-collection.dto';
import { ListCollectionsQueryDto } from './dto/list-collections-query.dto';
import { ReorderProductsDto } from './dto/reorder-products.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

/** Convert a display name to a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Collection service: CRUD with slug generation/uniqueness and product-membership
 * management (add/remove/reorder). Holds business logic only; every Prisma query
 * is delegated to {@link CollectionsRepository}.
 */
@Injectable()
export class CollectionsService {
  constructor(private readonly repository: CollectionsRepository) {}

  async create(dto: CreateCollectionDto) {
    let slug: string;
    if (dto.slug) {
      if (await this.repository.slugExists(dto.slug)) {
        throw this.slugTaken(dto.slug);
      }
      slug = dto.slug;
    } else {
      slug = await this.generateUniqueSlug(slugify(dto.name));
    }

    try {
      return await this.repository.create({
        id: newId(),
        name: dto.name,
        slug,
        description: dto.description ?? null,
        image: dto.image ?? null,
        status: dto.status ?? 'ACTIVE',
        sortOrder: dto.sortOrder ?? 0,
        seoTitle: dto.seoTitle ?? null,
        seoDescription: dto.seoDescription ?? null,
      });
    } catch (error) {
      throw this.mapSlugConflict(error, slug);
    }
  }

  async list(query: ListCollectionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filters: CollectionListFilters = {};
    if (query.status) {
      filters.status = query.status;
    }

    const [items, total] = await this.repository.listAndCount(
      filters,
      query.sort ?? 'newest',
      (page - 1) * limit,
      limit,
    );

    return {
      items,
      pageInfo: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    };
  }

  async getById(id: string) {
    if (!UUID_PATTERN.test(id)) {
      throw this.notFound();
    }
    const collection = await this.repository.findById(id);
    if (!collection) {
      throw this.notFound();
    }
    return collection;
  }

  async getBySlug(slug: string) {
    const collection = await this.repository.findBySlug(slug);
    if (!collection) {
      throw this.notFound();
    }
    return collection;
  }

  async update(id: string, dto: UpdateCollectionDto) {
    await this.getById(id);

    if (dto.slug !== undefined) {
      const owner = await this.repository.findBySlug(dto.slug);
      if (owner && owner.id !== id) {
        throw this.slugTaken(dto.slug);
      }
    }

    try {
      return await this.repository.update(id, {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.image !== undefined ? { image: dto.image } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
        ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
      });
    } catch (error) {
      throw this.mapSlugConflict(error, dto.slug ?? '');
    }
  }

  async remove(id: string) {
    await this.getById(id);
    await this.repository.delete(id);
    return { id };
  }

  async listProducts(id: string) {
    const rows = await this.repository.listProducts(id);
    return rows.map((row) => ({ ...row.product, sortOrder: row.sortOrder }));
  }

  async addProducts(id: string, dto: AddProductsDto) {
    await this.ensureCollectionExists(id);
    for (const productId of dto.productIds) {
      if (!(await this.repository.productExists(productId))) {
        throw new UnprocessableEntityException({
          code: 'PRODUCT_NOT_FOUND',
          message: `Product "${productId}" does not exist`,
        });
      }
      if (await this.repository.collectionProductExists(id, productId)) {
        throw new ConflictException({
          code: 'PRODUCT_ALREADY_IN_COLLECTION',
          message: `Product "${productId}" is already in the collection`,
        });
      }
    }
    await this.repository.addProducts(id, dto.productIds);
    return this.listProducts(id);
  }

  async removeProduct(id: string, productId: string) {
    await this.ensureCollectionExists(id);
    const removed = await this.repository.removeProduct(id, productId);
    if (removed === 0) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Product is not in the collection',
      });
    }
    return { collectionId: id, productId };
  }

  async reorderProducts(id: string, dto: ReorderProductsDto) {
    await this.ensureCollectionExists(id);
    await this.repository.reorder(id, dto.items);
    return this.listProducts(id);
  }

  /** Append `-2`, `-3`, … to a base slug until it is free. */
  private async generateUniqueSlug(base: string): Promise<string> {
    const root = base || 'collection';
    let candidate = root;
    let suffix = 2;
    while (await this.repository.slugExists(candidate)) {
      candidate = `${root}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private async ensureCollectionExists(id: string): Promise<void> {
    if (!UUID_PATTERN.test(id) || !(await this.repository.exists(id))) {
      throw new UnprocessableEntityException({
        code: 'COLLECTION_NOT_FOUND',
        message: 'Referenced collection does not exist',
      });
    }
  }

  private mapSlugConflict(error: unknown, slug: string): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return this.slugTaken(slug);
    }
    return error;
  }

  private slugTaken(slug: string): ConflictException {
    return new ConflictException({
      code: 'SLUG_TAKEN',
      message: `Slug "${slug}" is already in use`,
    });
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found' });
  }
}
