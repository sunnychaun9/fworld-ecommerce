import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { CreateVariantDto, UUID_PATTERN } from './dto/create-variant.dto';
import { ListVariantsQueryDto } from './dto/list-variants-query.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { VariantListFilters, VariantsRepository } from './variants.repository';

/**
 * Product variant (SKU) service: CRUD with product-existence checks, globally
 * unique SKU/barcode, and per-product uniqueness of (size, color). Holds business
 * logic only; every Prisma query is delegated to {@link VariantsRepository}.
 */
@Injectable()
export class VariantsService {
  constructor(private readonly repository: VariantsRepository) {}

  async create(dto: CreateVariantDto) {
    if (!(await this.repository.productExists(dto.productId))) {
      throw new UnprocessableEntityException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Referenced product does not exist',
      });
    }
    if (await this.repository.skuExists(dto.sku)) {
      throw this.skuTaken(dto.sku);
    }
    if (dto.barcode && (await this.repository.barcodeExists(dto.barcode))) {
      throw this.barcodeTaken(dto.barcode);
    }
    await this.assertNoDuplicate(dto.productId, dto.size ?? null, dto.color ?? null, null);

    try {
      return await this.repository.create({
        id: newId(),
        productId: dto.productId,
        sku: dto.sku,
        barcode: dto.barcode ?? null,
        size: dto.size ?? null,
        color: dto.color ?? null,
        colorHex: dto.colorHex ?? null,
        priceOverride: dto.priceOverride ?? null,
      });
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async list(query: ListVariantsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filters: VariantListFilters = {};
    if (query.productId) {
      filters.productId = query.productId;
    }
    if (query.size !== undefined) {
      filters.size = query.size;
    }
    if (query.color !== undefined) {
      filters.color = query.color;
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

  async listByProduct(productId: string) {
    return this.list({ productId, sort: 'newest' });
  }

  async getById(id: string) {
    if (!UUID_PATTERN.test(id)) {
      throw this.notFound();
    }
    const variant = await this.repository.findById(id);
    if (!variant) {
      throw this.notFound();
    }
    return variant;
  }

  async update(id: string, dto: UpdateVariantDto) {
    const existing = await this.getById(id);

    if (
      dto.sku !== undefined &&
      dto.sku !== existing.sku &&
      (await this.repository.skuExists(dto.sku))
    ) {
      throw this.skuTaken(dto.sku);
    }
    if (
      dto.barcode !== undefined &&
      dto.barcode !== existing.barcode &&
      (await this.repository.barcodeExists(dto.barcode))
    ) {
      throw this.barcodeTaken(dto.barcode);
    }

    if (dto.size !== undefined || dto.color !== undefined) {
      const size = dto.size !== undefined ? dto.size : existing.size;
      const color = dto.color !== undefined ? dto.color : existing.color;
      await this.assertNoDuplicate(existing.productId, size ?? null, color ?? null, id);
    }

    try {
      return await this.repository.update(id, {
        ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
        ...(dto.barcode !== undefined ? { barcode: dto.barcode } : {}),
        ...(dto.size !== undefined ? { size: dto.size } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.colorHex !== undefined ? { colorHex: dto.colorHex } : {}),
        ...(dto.priceOverride !== undefined ? { priceOverride: dto.priceOverride } : {}),
      });
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async remove(id: string) {
    await this.getById(id);
    await this.repository.delete(id);
    return { id };
  }

  /** Reject a (product, size, color) combination already used by another variant. */
  private async assertNoDuplicate(
    productId: string,
    size: string | null,
    color: string | null,
    excludeId: string | null,
  ): Promise<void> {
    const dup = await this.repository.findDuplicate(productId, size, color);
    if (dup && dup.id !== excludeId) {
      throw new ConflictException({
        code: 'VARIANT_EXISTS',
        message: 'A variant with the same size and color already exists for this product',
      });
    }
  }

  private mapConflict(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException({
        code: 'VARIANT_CONFLICT',
        message: 'A unique field (sku, barcode, or size/color) is already in use',
      });
    }
    return error;
  }

  private skuTaken(sku: string): ConflictException {
    return new ConflictException({ code: 'SKU_TAKEN', message: `SKU "${sku}" is already in use` });
  }

  private barcodeTaken(barcode: string): ConflictException {
    return new ConflictException({
      code: 'BARCODE_TAKEN',
      message: `Barcode "${barcode}" is already in use`,
    });
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'NOT_FOUND', message: 'Variant not found' });
  }
}
