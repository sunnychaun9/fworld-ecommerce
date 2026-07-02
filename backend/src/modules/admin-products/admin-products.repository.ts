import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/**
 * Bulk product data-access layer. **All Prisma queries live here**; the service
 * holds business logic only. Bulk writes are soft-validated — unknown ids are
 * simply not matched.
 */
@Injectable()
export class AdminProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async updateStatus(ids: string[], status: string): Promise<number> {
    const result = await this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    return result.count;
  }

  async updateFlags(ids: string[], data: Prisma.ProductUpdateManyMutationInput): Promise<number> {
    const result = await this.prisma.product.updateMany({ where: { id: { in: ids } }, data });
    return result.count;
  }
}
