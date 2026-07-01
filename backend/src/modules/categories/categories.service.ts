import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { PrismaService } from '../../database/prisma.service';
import { UUID_PATTERN } from './dto/create-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
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
 * Category taxonomy service: self-nesting CRUD with slug uniqueness, cycle
 * prevention, and non-empty delete protection. Stock/products are owned by
 * later catalog slices.
 */
@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug ?? slugify(dto.name);
    if (dto.parentId) {
      await this.ensureExists(dto.parentId);
    }
    try {
      return await this.prisma.category.create({
        data: {
          id: newId(),
          name: dto.name,
          slug,
          description: dto.description ?? null,
          parentId: dto.parentId ?? null,
          sortOrder: dto.sortOrder ?? 0,
          status: dto.status ?? 'ACTIVE',
          seoTitle: dto.seoTitle ?? null,
          seoDescription: dto.seoDescription ?? null,
        },
      });
    } catch (error) {
      throw this.mapSlugConflict(error, slug);
    }
  }

  async list(query: ListCategoriesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CategoryWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.rootOnly === 'true') {
      where.parentId = null;
    } else if (query.parentId) {
      where.parentId = query.parentId;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.category.count({ where }),
    ]);

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
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw this.notFound();
    }
    return category;
  }

  async getBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({ where: { slug } });
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

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...('parentId' in dto ? { parentId: dto.parentId ?? null } : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
          ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
        },
      });
    } catch (error) {
      throw this.mapSlugConflict(error, dto.slug ?? '');
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);
    const children = await this.prisma.category.count({ where: { parentId: id } });
    if (children > 0) {
      throw new ConflictException({
        code: 'CATEGORY_NOT_EMPTY',
        message: 'Category has child categories',
      });
    }
    await this.prisma.category.delete({ where: { id } });
    return { id };
  }

  private async ensureExists(id: string): Promise<void> {
    if (!UUID_PATTERN.test(id)) {
      throw this.notFound();
    }
    const found = await this.prisma.category.findUnique({ where: { id }, select: { id: true } });
    if (!found) {
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
      const parent: { parentId: string | null } | null = await this.prisma.category.findUnique({
        where: { id: cursor },
        select: { parentId: true },
      });
      cursor = parent?.parentId ?? null;
    }
  }

  private mapSlugConflict(error: unknown, slug: string): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException({
        code: 'SLUG_TAKEN',
        message: `Slug "${slug}" is already in use`,
      });
    }
    return error;
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
