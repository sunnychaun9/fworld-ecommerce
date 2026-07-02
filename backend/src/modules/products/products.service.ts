import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { CreateProductDto, UUID_PATTERN } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductListFilters, ProductsRepository } from './products.repository';

/** Convert a display name to a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Effective values used to validate a publish (ACTIVE) transition. */
interface PublishCandidate {
  name?: string | null;
  description?: string | null;
  mrp: number;
  sellingPrice: number;
}

/**
 * Product service: CRUD with slug generation/uniqueness, price integrity
 * (sellingPrice ≤ MRP), referential checks (category/brand), and publish-gating
 * for ACTIVE products. Holds business logic only; every Prisma query is
 * delegated to {@link ProductsRepository}.
 */
@Injectable()
export class ProductsService {
  constructor(private readonly repository: ProductsRepository) {}

  async create(dto: CreateProductDto) {
    this.assertPriceValid(dto.mrp, dto.sellingPrice);
    await this.assertCategoryExists(dto.categoryId);
    if (dto.brandId) {
      await this.assertBrandExists(dto.brandId);
    }

    const status = dto.status ?? 'DRAFT';
    if (status === 'ACTIVE') {
      this.assertPublishable({
        name: dto.name,
        description: dto.description,
        mrp: dto.mrp,
        sellingPrice: dto.sellingPrice,
      });
    }

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
        shortDescription: dto.shortDescription ?? null,
        description: dto.description ?? null,
        categoryId: dto.categoryId,
        brandId: dto.brandId ?? null,
        mrp: dto.mrp,
        sellingPrice: dto.sellingPrice,
        fit: dto.fit ?? null,
        fabric: dto.fabric ?? null,
        sleeveLength: dto.sleeveLength ?? null,
        pattern: dto.pattern ?? null,
        neckType: dto.neckType ?? null,
        occasion: dto.occasion ?? null,
        featured: dto.featured ?? false,
        newArrival: dto.newArrival ?? false,
        bestSeller: dto.bestSeller ?? false,
        status,
        seoTitle: dto.seoTitle ?? null,
        seoDescription: dto.seoDescription ?? null,
      });
    } catch (error) {
      throw this.mapSlugConflict(error, slug);
    }
  }

  async list(query: ListProductsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filters: ProductListFilters = {};
    if (query.status) {
      filters.status = query.status;
    }
    if (query.categoryId) {
      filters.categoryId = query.categoryId;
    }
    if (query.brandId) {
      filters.brandId = query.brandId;
    }
    if (query.featured !== undefined) {
      filters.featured = query.featured === 'true';
    }
    if (query.newArrival !== undefined) {
      filters.newArrival = query.newArrival === 'true';
    }
    if (query.bestSeller !== undefined) {
      filters.bestSeller = query.bestSeller === 'true';
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
    const product = await this.repository.findById(id);
    if (!product) {
      throw this.notFound();
    }
    return product;
  }

  async getBySlug(slug: string) {
    const product = await this.repository.findBySlug(slug);
    if (!product) {
      throw this.notFound();
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.getById(id);

    const mrp = dto.mrp ?? Number(existing.mrp);
    const sellingPrice = dto.sellingPrice ?? Number(existing.sellingPrice);
    this.assertPriceValid(mrp, sellingPrice);

    if (dto.categoryId !== undefined) {
      await this.assertCategoryExists(dto.categoryId);
    }
    if (dto.brandId) {
      await this.assertBrandExists(dto.brandId);
    }

    const status = dto.status ?? existing.status;
    if (status === 'ACTIVE') {
      this.assertPublishable({
        name: dto.name ?? existing.name,
        description: dto.description ?? existing.description,
        mrp,
        sellingPrice,
      });
    }

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
        ...(dto.shortDescription !== undefined ? { shortDescription: dto.shortDescription } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.brandId !== undefined ? { brandId: dto.brandId } : {}),
        ...(dto.mrp !== undefined ? { mrp: dto.mrp } : {}),
        ...(dto.sellingPrice !== undefined ? { sellingPrice: dto.sellingPrice } : {}),
        ...(dto.fit !== undefined ? { fit: dto.fit } : {}),
        ...(dto.fabric !== undefined ? { fabric: dto.fabric } : {}),
        ...(dto.sleeveLength !== undefined ? { sleeveLength: dto.sleeveLength } : {}),
        ...(dto.pattern !== undefined ? { pattern: dto.pattern } : {}),
        ...(dto.neckType !== undefined ? { neckType: dto.neckType } : {}),
        ...(dto.occasion !== undefined ? { occasion: dto.occasion } : {}),
        ...(dto.featured !== undefined ? { featured: dto.featured } : {}),
        ...(dto.newArrival !== undefined ? { newArrival: dto.newArrival } : {}),
        ...(dto.bestSeller !== undefined ? { bestSeller: dto.bestSeller } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
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

  /** Append `-2`, `-3`, … to a base slug until it is free. */
  private async generateUniqueSlug(base: string): Promise<string> {
    const root = base || 'product';
    let candidate = root;
    let suffix = 2;
    while (await this.repository.slugExists(candidate)) {
      candidate = `${root}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private assertPriceValid(mrp: number, sellingPrice: number): void {
    if (sellingPrice > mrp) {
      throw new UnprocessableEntityException({
        code: 'SELLING_PRICE_EXCEEDS_MRP',
        message: 'sellingPrice cannot exceed MRP',
      });
    }
  }

  private assertPublishable(candidate: PublishCandidate): void {
    const missing: string[] = [];
    if (!candidate.name) {
      missing.push('name');
    }
    if (!candidate.description) {
      missing.push('description');
    }
    if (!(candidate.mrp > 0)) {
      missing.push('mrp');
    }
    if (!(candidate.sellingPrice > 0)) {
      missing.push('sellingPrice');
    }
    if (missing.length > 0) {
      throw new UnprocessableEntityException({
        code: 'PRODUCT_PUBLISH_INVALID',
        message: `Product cannot be published; missing/invalid: ${missing.join(', ')}`,
      });
    }
  }

  private async assertCategoryExists(id: string): Promise<void> {
    if (!(await this.repository.categoryExists(id))) {
      throw new UnprocessableEntityException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Referenced category does not exist',
      });
    }
  }

  private async assertBrandExists(id: string): Promise<void> {
    if (!(await this.repository.brandExists(id))) {
      throw new UnprocessableEntityException({
        code: 'BRAND_NOT_FOUND',
        message: 'Referenced brand does not exist',
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
    return new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found' });
  }
}
