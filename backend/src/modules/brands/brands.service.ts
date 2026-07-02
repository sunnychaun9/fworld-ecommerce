import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { BrandListFilters, BrandsRepository } from './brands.repository';
import { CreateBrandDto, UUID_PATTERN } from './dto/create-brand.dto';
import { ListBrandsQueryDto } from './dto/list-brands-query.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

/** Convert a display name to a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Brand service: CRUD with slug generation/uniqueness and delete-protection when
 * products reference the brand. Holds business logic only; every Prisma query is
 * delegated to {@link BrandsRepository}.
 */
@Injectable()
export class BrandsService {
  constructor(private readonly repository: BrandsRepository) {}

  async create(dto: CreateBrandDto) {
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
        logo: dto.logo ?? null,
        website: dto.website ?? null,
        status: dto.status ?? 'ACTIVE',
        seoTitle: dto.seoTitle ?? null,
        seoDescription: dto.seoDescription ?? null,
      });
    } catch (error) {
      throw this.mapSlugConflict(error, slug);
    }
  }

  async list(query: ListBrandsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filters: BrandListFilters = {};
    if (query.status) {
      filters.status = query.status;
    }

    const [items, total] = await this.repository.listAndCount(filters, (page - 1) * limit, limit);

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
    const brand = await this.repository.findById(id);
    if (!brand) {
      throw this.notFound();
    }
    return brand;
  }

  async getBySlug(slug: string) {
    const brand = await this.repository.findBySlug(slug);
    if (!brand) {
      throw this.notFound();
    }
    return brand;
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.ensureExists(id);

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
        ...(dto.logo !== undefined ? { logo: dto.logo } : {}),
        ...(dto.website !== undefined ? { website: dto.website } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
        ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
      });
    } catch (error) {
      throw this.mapSlugConflict(error, dto.slug ?? '');
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);
    if ((await this.repository.countProducts(id)) > 0) {
      throw new ConflictException({
        code: 'BRAND_IN_USE',
        message: 'Brand is referenced by one or more products',
      });
    }
    await this.repository.delete(id);
    return { id };
  }

  /** Append `-2`, `-3`, … to a base slug until it is free. */
  private async generateUniqueSlug(base: string): Promise<string> {
    const root = base || 'brand';
    let candidate = root;
    let suffix = 2;
    while (await this.repository.slugExists(candidate)) {
      candidate = `${root}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private async ensureExists(id: string): Promise<void> {
    if (!UUID_PATTERN.test(id)) {
      throw this.notFound();
    }
    if (!(await this.repository.exists(id))) {
      throw this.notFound();
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
    return new NotFoundException({ code: 'NOT_FOUND', message: 'Brand not found' });
  }
}
