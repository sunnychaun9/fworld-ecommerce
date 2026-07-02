import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Inventory, Prisma } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { CreateInventoryDto, StockStatus, UUID_PATTERN } from './dto/create-inventory.dto';
import { ListInventoryQueryDto } from './dto/list-inventory-query.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryListFilters, InventoryRepository } from './inventory.repository';

/** Derive the (never-stored) stock status from stock levels. */
export function computeStockStatus(availableStock: number, lowStockAlert: number): StockStatus {
  if (availableStock === 0) {
    return 'OUT_OF_STOCK';
  }
  if (availableStock <= lowStockAlert) {
    return 'LOW_STOCK';
  }
  return 'IN_STOCK';
}

type InventoryResponse = Inventory & { stockStatus: StockStatus };

/**
 * Inventory service: one record per variant, with non-negative stock levels,
 * `reservedStock <= availableStock`, and a computed stock status returned in
 * responses. Holds business logic only; every Prisma query is delegated to
 * {@link InventoryRepository}. Reservation/allocation are out of scope.
 */
@Injectable()
export class InventoryService {
  constructor(private readonly repository: InventoryRepository) {}

  async create(dto: CreateInventoryDto): Promise<InventoryResponse> {
    if (!(await this.repository.variantExists(dto.variantId))) {
      throw new UnprocessableEntityException({
        code: 'VARIANT_NOT_FOUND',
        message: 'Referenced variant does not exist',
      });
    }
    if (await this.repository.existsForVariant(dto.variantId)) {
      throw new ConflictException({
        code: 'INVENTORY_EXISTS',
        message: 'Inventory already exists for this variant',
      });
    }

    const availableStock = dto.availableStock ?? 0;
    const reservedStock = dto.reservedStock ?? 0;
    const lowStockAlert = dto.lowStockAlert ?? 0;
    this.assertReservedWithinAvailable(reservedStock, availableStock);

    try {
      const created = await this.repository.create({
        id: newId(),
        variantId: dto.variantId,
        availableStock,
        reservedStock,
        lowStockAlert,
      });
      return this.toResponse(created);
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async list(query: ListInventoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filters: InventoryListFilters = {};
    if (query.variantId) {
      filters.variantId = query.variantId;
    }
    if (query.stockStatus) {
      filters.stockStatus = query.stockStatus;
    }

    const [items, total] = await this.repository.listAndCount(
      filters,
      query.sort ?? 'newest',
      (page - 1) * limit,
      limit,
    );

    return {
      items: items.map((item) => this.toResponse(item)),
      pageInfo: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    };
  }

  async getById(id: string): Promise<InventoryResponse> {
    return this.toResponse(await this.findOrThrow(id));
  }

  async getByVariant(variantId: string): Promise<InventoryResponse> {
    if (!UUID_PATTERN.test(variantId)) {
      throw this.notFound();
    }
    const inventory = await this.repository.findByVariant(variantId);
    if (!inventory) {
      throw this.notFound();
    }
    return this.toResponse(inventory);
  }

  async update(id: string, dto: UpdateInventoryDto): Promise<InventoryResponse> {
    const existing = await this.findOrThrow(id);

    const availableStock = dto.availableStock ?? existing.availableStock;
    const reservedStock = dto.reservedStock ?? existing.reservedStock;
    this.assertReservedWithinAvailable(reservedStock, availableStock);

    const updated = await this.repository.update(id, {
      ...(dto.availableStock !== undefined ? { availableStock: dto.availableStock } : {}),
      ...(dto.reservedStock !== undefined ? { reservedStock: dto.reservedStock } : {}),
      ...(dto.lowStockAlert !== undefined ? { lowStockAlert: dto.lowStockAlert } : {}),
    });
    return this.toResponse(updated);
  }

  async remove(id: string) {
    await this.findOrThrow(id);
    await this.repository.delete(id);
    return { id };
  }

  private toResponse(inventory: Inventory): InventoryResponse {
    return {
      ...inventory,
      stockStatus: computeStockStatus(inventory.availableStock, inventory.lowStockAlert),
    };
  }

  private async findOrThrow(id: string): Promise<Inventory> {
    if (!UUID_PATTERN.test(id)) {
      throw this.notFound();
    }
    const inventory = await this.repository.findById(id);
    if (!inventory) {
      throw this.notFound();
    }
    return inventory;
  }

  private assertReservedWithinAvailable(reservedStock: number, availableStock: number): void {
    if (reservedStock > availableStock) {
      throw new UnprocessableEntityException({
        code: 'RESERVED_EXCEEDS_AVAILABLE',
        message: 'reservedStock cannot exceed availableStock',
      });
    }
  }

  private mapConflict(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException({
        code: 'INVENTORY_EXISTS',
        message: 'Inventory already exists for this variant',
      });
    }
    return error;
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'NOT_FOUND', message: 'Inventory not found' });
  }
}
