import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { CategoriesRepository, CategoryListFilters } from './categories.repository';
import { CreateCategoryDto, UUID_PATTERN } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/** Convert a display name to a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Category taxonomy service: self-nesting CRUD with slug generation/uniqueness,
 * cycle prevention, and non-empty delete protection. Holds business logic only;
 * every Prisma query is delegated to {@link CategoriesRepository}.
 */
@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      await this.ensureExists(dto.parentId);
    }

    // An explicit slug must be unique; a generated slug is auto-suffixed.
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
        parentId: dto.parentId ?? null,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? 'ACTIVE',
        seoTitle: dto.seoTitle ?? null,
        seoDescription: dto.seoDescription ?? null,
      });
    } catch (error) {
      throw this.mapSlugConflict(error, slug);
    }
  }

  async list(query: ListCategoriesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filters: CategoryListFilters = {};
    if (query.status) {
      filters.status = query.status;
    }
    if (query.rootOnly === 'true') {
      filters.parentId = null;
    } else if (query.parentId) {
      filters.parentId = query.parentId;
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
    const category = await this.repository.findById(id);
    if (!category) {
      throw this.notFound();
    }
    return category;
  }

  async getBySlug(slug: string) {
    const category = await this.repository.findBySlug(slug);
    if (!category) {
      throw this.notFound();
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === id) {
        throw this.cycle();
      }
      await this.ensureExists(dto.parentId);
      await this.ensureNoCycle(id, dto.parentId);
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
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...('parentId' in dto ? { parentId: dto.parentId ?? null } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
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
    if ((await this.repository.countChildren(id)) > 0) {
      throw new ConflictException({
        code: 'CATEGORY_NOT_EMPTY',
        message: 'Category has child categories',
      });
    }
    await this.repository.delete(id);
    return { id };
  }

  /** Append `-2`, `-3`, … to a base slug until it is free. */
  private async generateUniqueSlug(base: string): Promise<string> {
    const root = base || 'category';
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

  /** Reject a re-parent that would make `id` its own ancestor. */
  private async ensureNoCycle(id: string, parentId: string): Promise<void> {
    let cursor: string | null = parentId;
    while (cursor) {
      if (cursor === id) {
        throw this.cycle();
      }
      cursor = await this.repository.getParentId(cursor);
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
    return new NotFoundException({ code: 'NOT_FOUND', message: 'Category not found' });
  }

  private cycle(): UnprocessableEntityException {
    return new UnprocessableEntityException({
      code: 'CATEGORY_CYCLE',
      message: 'A category cannot be its own ancestor',
    });
  }
}
