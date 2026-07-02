import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

import { newId } from '../../common/utils/id.util';
import { CreateImageDto, UUID_PATTERN } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { MediaRepository } from './media.repository';

/**
 * Product image (media) service: CRUD for image URLs attached to a product and
 * optionally to one of its variants. Holds business logic only; every Prisma
 * query is delegated to {@link MediaRepository}. No uploads, no soft delete.
 */
@Injectable()
export class MediaService {
  constructor(private readonly repository: MediaRepository) {}

  async create(dto: CreateImageDto) {
    if (!(await this.repository.productExists(dto.productId))) {
      throw new UnprocessableEntityException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Referenced product does not exist',
      });
    }
    if (dto.variantId) {
      await this.assertVariantBelongsToProduct(dto.variantId, dto.productId);
    }

    return this.repository.create({
      id: newId(),
      productId: dto.productId,
      variantId: dto.variantId ?? null,
      url: dto.url,
      altText: dto.altText ?? null,
      sortOrder: dto.sortOrder ?? 0,
    });
  }

  listByProduct(productId: string) {
    return this.repository.findByProduct(productId);
  }

  async getById(id: string) {
    if (!UUID_PATTERN.test(id)) {
      throw this.notFound();
    }
    const image = await this.repository.findById(id);
    if (!image) {
      throw this.notFound();
    }
    return image;
  }

  async update(id: string, dto: UpdateImageDto) {
    const existing = await this.getById(id);

    if (dto.variantId !== undefined && dto.variantId !== null) {
      await this.assertVariantBelongsToProduct(dto.variantId, existing.productId);
    }

    return this.repository.update(id, {
      ...(dto.url !== undefined ? { url: dto.url } : {}),
      ...('variantId' in dto ? { variantId: dto.variantId ?? null } : {}),
      ...(dto.altText !== undefined ? { altText: dto.altText } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
    });
  }

  async remove(id: string) {
    await this.getById(id);
    await this.repository.delete(id);
    return { id };
  }

  /** A variant must exist and belong to the given product. */
  private async assertVariantBelongsToProduct(variantId: string, productId: string): Promise<void> {
    const owner = await this.repository.getVariantProductId(variantId);
    if (owner === null) {
      throw new UnprocessableEntityException({
        code: 'VARIANT_NOT_FOUND',
        message: 'Referenced variant does not exist',
      });
    }
    if (owner !== productId) {
      throw new UnprocessableEntityException({
        code: 'VARIANT_PRODUCT_MISMATCH',
        message: 'Variant does not belong to the specified product',
      });
    }
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'NOT_FOUND', message: 'Image not found' });
  }
}
