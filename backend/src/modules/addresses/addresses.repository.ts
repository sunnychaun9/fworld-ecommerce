import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/**
 * Address data-access layer. **All Prisma queries live here**; the service holds
 * business logic only.
 */
@Injectable()
export class AddressesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByUser(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(userId: string, id: string) {
    return this.prisma.address.findFirst({ where: { id, userId } });
  }

  create(data: Prisma.AddressUncheckedCreateInput) {
    return this.prisma.address.create({ data });
  }

  update(id: string, data: Prisma.AddressUncheckedUpdateInput) {
    return this.prisma.address.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.address.delete({ where: { id } });
  }

  /** Atomically make `id` the user's only default address. */
  setDefault(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
      return tx.address.update({ where: { id }, data: { isDefault: true } });
    });
  }
}
